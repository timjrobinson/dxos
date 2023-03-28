//
// Copyright 2022 DXOS.org
//

import assert from 'node:assert';

import { scheduleTask, sleep, Trigger } from '@dxos/async';
import {
  AuthenticatingInvitationProvider,
  AUTHENTICATION_CODE_LENGTH,
  CancellableInvitationObservable,
  InvitationObservableProvider,
  INVITATION_TIMEOUT,
  ON_CLOSE_DELAY,
  AbstractInvitationsHandler,
  InvitationsOptions
} from '@dxos/client';
import { Context } from '@dxos/context';
import { createAdmissionCredentials, generatePasscode, getCredentialAssertion } from '@dxos/credentials';
import { SigningContext } from '@dxos/echo-pipeline';
import { writeMessages } from '@dxos/feed-store';
import { Keyring } from '@dxos/keyring';
import { PublicKey } from '@dxos/keys';
import { log } from '@dxos/log';
import { createTeleportProtocolFactory, NetworkManager, StarTopology, SwarmConnection } from '@dxos/network-manager';
import { schema } from '@dxos/protocols';
import { Invitation } from '@dxos/protocols/proto/dxos/client/services';
import { FeedMessage } from '@dxos/protocols/proto/dxos/echo/feed';
import { ProfileDocument } from '@dxos/protocols/proto/dxos/halo/credentials';
import {
  AuthenticationRequest,
  AuthenticationResponse,
  AuthMethod,
  Introduction,
  IntroductionResponse,
  SpaceAdmissionCredentials,
  SpaceAdmissionRequest,
  SpaceHostService,
  AdmissionCredentials
} from '@dxos/protocols/proto/dxos/halo/invitations';
import { ExtensionContext, RpcExtension } from '@dxos/teleport';

import { DataSpace, DataSpaceManager } from '../spaces';

const MAX_OTP_ATTEMPTS = 3;

interface InvitationHandlerX {
  /**
   *             }
              // 3. Generate a pair of keys for our feeds.
              const controlFeedKey = await this._keyring.createKey();
              const dataFeedKey = await this._keyring.createKey();
              identityKey: this._signingContext.identityKey,
                  deviceKey: this._signingContext.deviceKey,
                  

   */
  createAdmissionRequest(): Promise<AdmissionRequest>;

  /**
   * 
              const space = await this._spaceManager.acceptSpace({
                spaceKey: assertion.spaceKey,
                genesisFeedKey: assertion.genesisFeedKey,
                controlTimeframe,
                dataTimeframe
              });

              // Record credential in our HALO.
              await this._signingContext.recordCredential(credential);
   */
  accept(credentials: AdmissionCredentials): Promise<void>;

  /*
            log('writing guest credentials', { host: this._signingContext.deviceKey, guest: deviceKey });
            // TODO(burdon): Check if already admitted.
            const credentials: FeedMessage.Payload[] = await createAdmissionCredentials(
              this._signingContext.credentialSigner,
              identityKey,
              space.key,
              space.inner.genesisFeedKey,
              guestProfile
            );

            // TODO(dmaretskyi): Refactor.
            assert(credentials[0].credential);
            const spaceMemberCredential = credentials[0].credential.credential;
            assert(getCredentialAssertion(spaceMemberCredential)['@type'] === 'dxos.halo.credentials.SpaceMember');

            await writeMessages(space.inner.controlPipeline.writer, credentials);
  */
  requestAdmission(request: AdmissionRequest): Promise<AdmissionCredentials>;
}


/**
 * Handles the life-cycle of Space invitations between peers.
 */
// TODO(dmaretskyi): Split into Host and Guest parts.
// TODO(dmaretskyi): Rename.
export class GenericInvitationsHandler{
  constructor(
    networkManager: NetworkManager,
  ) {
    super(networkManager);
  }

  /**
   * Creates an invitation and listens for a join request from the invited (guest) peer.
   */
  createInvitation(handler: InvitationHandlerX, options?: InvitationsOptions): CancellableInvitationObservable {
    let swarmConnection: SwarmConnection | undefined;
    const { type, timeout = INVITATION_TIMEOUT, swarmKey } = options ?? {};
    assert(type !== Invitation.Type.OFFLINE);
    assert(space);

    // TODO(dmaretskyi): Add invitation kind: halo/space.
    const invitation: Invitation = {
      type,
      invitationId: PublicKey.random().toHex(),
      swarmKey: swarmKey ?? PublicKey.random(),
      spaceKey: space.key,
      authMethod: options?.authMethod ?? AuthMethod.SHARED_SECRET,
      authenticationCode: generatePasscode(AUTHENTICATION_CODE_LENGTH) // TODO(dmaretskyi): Don't generate if authMethod === NONE .
    };

    const ctx = new Context({
      onError: (err) => {
        void ctx.dispose();
        observable.callback.onError(err);
      }
    });

    // TODO(burdon): Stop anything pending.
    const observable = new InvitationObservableProvider(async () => {
      await swarmConnection?.close();
    });

    let authenticationPassed = false;
    let authenticationRetry = 0;

    // Called for every connecting peer.
    const createExtension = (): HostSpaceInvitationExtension => {
      const complete = new Trigger<PublicKey>();
      let guestProfile: ProfileDocument | undefined;

      const hostInvitationExtension = new HostSpaceInvitationExtension({
        introduce: async ({ profile }) => {
          log('guest introduced itself', {
            guestProfile: profile,
            host: this._signingContext.deviceKey,
            spaceKey: space.key
          });

          guestProfile = profile;

          // TODO(burdon): Is this the right place to set this state?
          // TODO(dmaretskyi): Should we expose guest's profile in this callback?
          observable.callback.onAuthenticating?.(invitation);

          return {
            spaceKey:
              type === Invitation.Type.INTERACTIVE_TESTING || type === Invitation.Type.MULTIUSE_TESTING
                ? space.key
                : undefined,
            authMethod: invitation.authMethod!
          };
        },

        authenticate: async ({ authenticationCode: code }) => {
          log('received authentication request', { authenticationCode: code });
          let status = AuthenticationResponse.Status.OK;

          switch (invitation.authMethod) {
            case AuthMethod.NONE: {
              log('authentication not required');
              return { status: AuthenticationResponse.Status.OK };
            }
            case AuthMethod.SHARED_SECRET: {
              if (invitation.authenticationCode) {
                if (authenticationRetry++ > MAX_OTP_ATTEMPTS) {
                  status = AuthenticationResponse.Status.INVALID_OPT_ATTEMPTS;
                } else if (code !== invitation.authenticationCode) {
                  status = AuthenticationResponse.Status.INVALID_OTP;
                } else {
                  authenticationPassed = true;
                }
              }
              break;
            }
            default: {
              log.error('invalid authentication method', { authMethod: invitation.authMethod });
              status = AuthenticationResponse.Status.INTERNAL_ERROR;
              break;
            }
          }

          return { status };
        },

        requestAdmission: async ({ identityKey, deviceKey, controlFeedKey, dataFeedKey }) => {
          try {
            // Check authenticated.
            if (isAuthenticationRequired(invitation) && !authenticationPassed) {
              throw new Error('Not authenticated');
            }

            log('writing guest credentials', { host: this._signingContext.deviceKey, guest: deviceKey });
            // TODO(burdon): Check if already admitted.
            const credentials: FeedMessage.Payload[] = await createAdmissionCredentials(
              this._signingContext.credentialSigner,
              identityKey,
              space.key,
              space.inner.genesisFeedKey,
              guestProfile
            );

            // TODO(dmaretskyi): Refactor.
            assert(credentials[0].credential);
            const spaceMemberCredential = credentials[0].credential.credential;
            assert(getCredentialAssertion(spaceMemberCredential)['@type'] === 'dxos.halo.credentials.SpaceMember');

            await writeMessages(space.inner.controlPipeline.writer, credentials);

            // Updating credentials complete.
            complete.wake(deviceKey);

            return {
              credential: spaceMemberCredential,
              controlTimeframe: space.inner.controlPipeline.state.timeframe,
              dataTimeframe: space.dataPipeline.pipelineState?.timeframe
            };
          } catch (err) {
            // TODO(burdon): Generic RPC callback to report error to client.
            observable.callback.onError(err);
            throw err; // Propagate error to guest.
          }
        },

        onOpen: () => {
          scheduleTask(ctx, async () => {
            try {
              log('connected', { host: this._signingContext.deviceKey });
              observable.callback.onConnected?.(invitation);
              const deviceKey = await complete.wait({ timeout });
              log('admitted guest', { host: this._signingContext.deviceKey, guest: deviceKey });
              observable.callback.onSuccess(invitation);
            } catch (err) {
              if (!observable.cancelled) {
                log.error('failed', err);
                observable.callback.onError(err);
              }
            } finally {
              if (type !== Invitation.Type.MULTIUSE_TESTING) {
                await sleep(ON_CLOSE_DELAY);
                await ctx.dispose();
              }
            }
          });
        }
      });
      return hostInvitationExtension;
    };

    scheduleTask(ctx, async () => {
      const topic = invitation.swarmKey!;
      const swarmConnection = await this._networkManager.joinSwarm({
        topic,
        peerId: topic,
        protocolProvider: createTeleportProtocolFactory(async (teleport) => {
          teleport.addExtension('dxos.halo.invitations', createExtension());
        }),
        topology: new StarTopology(topic)
      });
      ctx.onDispose(() => swarmConnection.close());

      observable.callback.onConnecting?.(invitation);
    });

    return observable;
  }

  /**
   * Waits for the host peer (inviter) to accept our join request.
   * The local guest peer (invitee) then sends the local space invitation to the host,
   * which then writes the guest's credentials to the space.
   */
  acceptInvitation(handler: InvitationHandlerX, invitation: Invitation, options?: InvitationsOptions): AuthenticatingInvitationProvider {
    const { timeout = INVITATION_TIMEOUT } = options ?? {};

    const ctx = new Context({
      onError: (err) => {
        void ctx.dispose();
        observable.callback.onError(err);
      }
    });

    const authenticated = new Trigger<string>();
    const observable = new AuthenticatingInvitationProvider({
      onCancel: async () => {
        await ctx.dispose();
      },

      onAuthenticate: async (code: string) => {
        // TODO(burdon): Reset creates a race condition? Event?
        authenticated.wake(code);
      }
    });

    let connectionCount = 0;
    const complete = new Trigger();

    const createExtension = (): GuestSpaceInvitationExtension => {
      const extension = new GuestSpaceInvitationExtension({
        onOpen: () => {
          scheduleTask(ctx, async () => {
            try {
              // TODO(burdon): Bug where guest may create multiple connections.
              if (++connectionCount > 1) {
                throw new Error(`multiple connections detected: ${connectionCount}`);
              }

              log('connected', { guest: this._signingContext.deviceKey });
              observable.callback.onConnected?.(invitation);

              // 1. Introduce guest to host.
              log('introduce', { guest: this._signingContext.deviceKey });
              const introductionResponse = await extension.rpc.SpaceHostService.introduce({
                profile: this._signingContext.profile
              });
              log('introduce response', { guest: this._signingContext.deviceKey, response: introductionResponse });
              invitation.authMethod = introductionResponse.authMethod;
              if (introductionResponse.spaceKey) {
                invitation.spaceKey = introductionResponse.spaceKey;
              }

              // TODO(dmaretskyi): Add a callback here to notify that we have introduced ourselves to the host (regradless of auth requirements).

              // 2. Get authentication code.
              // TODO(burdon): Test timeout (options for timeouts at different steps).
              if (isAuthenticationRequired(invitation)) {
                observable.callback.onAuthenticating?.(invitation);

                for (let attempt = 1; attempt <= MAX_OTP_ATTEMPTS; attempt++) {
                  log('guest waiting for authentication code...');
                  observable.callback.onAuthenticating?.(invitation);
                  const authenticationCode = await authenticated.wait({ timeout });

                  log('sending authentication request');
                  const response = await extension.rpc.SpaceHostService.authenticate({ authenticationCode });
                  if (response.status === undefined || response.status === AuthenticationResponse.Status.OK) {
                    break;
                  }

                  if (response.status === AuthenticationResponse.Status.INVALID_OTP) {
                    if (attempt === MAX_OTP_ATTEMPTS) {
                      throw new Error(`Maximum retry attempts: ${MAX_OTP_ATTEMPTS}`);
                    } else {
                      log('retrying invalid code', { attempt });
                      authenticated.reset();
                    }
                  }
                }
              }
              // 3. Generate a pair of keys for our feeds.
              const controlFeedKey = await this._keyring.createKey();
              const dataFeedKey = await this._keyring.createKey();

              // 4. Send admission credentials to host (with local space keys).
              log('request admission', { guest: this._signingContext.deviceKey });
              const { credential, controlTimeframe, dataTimeframe } =
                await extension.rpc.SpaceHostService.requestAdmission({
                  identityKey: this._signingContext.identityKey,
                  deviceKey: this._signingContext.deviceKey,
                  controlFeedKey,
                  dataFeedKey
                });

              // 4. Create local space.
              const assertion = getCredentialAssertion(credential);
              assert(assertion['@type'] === 'dxos.halo.credentials.SpaceMember', 'Invalid credential');
              assert(credential.subject.id.equals(this._signingContext.identityKey));

              const space = await this._spaceManager.acceptSpace({
                spaceKey: assertion.spaceKey,
                genesisFeedKey: assertion.genesisFeedKey,
                controlTimeframe,
                dataTimeframe
              });

              // Record credential in our HALO.
              await this._signingContext.recordCredential(credential);

              // 5. Success.
              log('admitted by host', { guest: this._signingContext.deviceKey, spaceKey: space.key });
              complete.wake();
            } catch (err) {
              if (!observable.cancelled) {
                log.warn('auth failed', err);
                observable.callback.onError(err);
              }
            } finally {
              await ctx.dispose();
            }
          });
        }
      });
      return extension;
    };

    scheduleTask(ctx, async () => {
      assert(invitation.swarmKey);
      const topic = invitation.swarmKey;
      const swarmConnection = await this._networkManager.joinSwarm({
        topic,
        peerId: PublicKey.random(),
        protocolProvider: createTeleportProtocolFactory(async (teleport) => {
          teleport.addExtension('dxos.halo.invitations', createExtension());
        }),
        topology: new StarTopology(topic)
      });
      ctx.onDispose(() => swarmConnection.close());

      observable.callback.onConnecting?.(invitation);
      await complete.wait();
      observable.callback.onSuccess(invitation);
      await ctx.dispose();
    });

    return observable;
  }
}

const isAuthenticationRequired = (invitation: Invitation) =>
  invitation.authMethod !== AuthMethod.NONE &&
  invitation.type !== Invitation.Type.INTERACTIVE_TESTING &&
  invitation.type !== Invitation.Type.MULTIUSE_TESTING;

type HostSpaceInvitationExtensionCallbacks = {
  // Deliberately not async to not block the extensions opening.
  onOpen: () => void;

  introduce: (introduction: Introduction) => Promise<IntroductionResponse>;
  authenticate: (request: AuthenticationRequest) => Promise<AuthenticationResponse>;
  requestAdmission: (request: SpaceAdmissionRequest) => Promise<SpaceAdmissionCredentials>;
};

/**
 * Host's side for a connection to a concrete peer in p2p network during invitation.
 */
class HostSpaceInvitationExtension extends RpcExtension<{}, { SpaceHostService: SpaceHostService }> {
  constructor(private readonly _callbacks: HostSpaceInvitationExtensionCallbacks) {
    super({
      exposed: {
        SpaceHostService: schema.getService('dxos.halo.invitations.SpaceHostService')
      }
    });
  }

  protected override async getHandlers(): Promise<{ SpaceHostService: SpaceHostService }> {
    return {
      // TODO(dmaretskyi): For now this is just forwarding the data to callbacks since we don't have session-specific logic.
      // Perhaps in the future we will have more complex logic here.
      SpaceHostService: {
        introduce: async (params) => {
          return this._callbacks.introduce(params);
        },

        authenticate: async (credentials) => {
          return this._callbacks.authenticate(credentials);
        },

        requestAdmission: async (credentials) => {
          return this._callbacks.requestAdmission(credentials);
        }
      }
    };
  }

  override async onOpen(context: ExtensionContext) {
    await super.onOpen(context);
    this._callbacks.onOpen();
  }
}

type GuestSpaceInvitationExtensionCallbacks = {
  // Deliberately not async to not block the extensions opening.
  onOpen: () => void;
};

/**
 * Guest's side for a connection to a concrete peer in p2p network during invitation.
 */
class GuestSpaceInvitationExtension extends RpcExtension<{ SpaceHostService: SpaceHostService }, {}> {
  constructor(private readonly _callbacks: GuestSpaceInvitationExtensionCallbacks) {
    super({
      requested: {
        SpaceHostService: schema.getService('dxos.halo.invitations.SpaceHostService')
      }
    });
  }

  protected override async getHandlers() {
    return {};
  }

  override async onOpen(context: ExtensionContext) {
    await super.onOpen(context);
    this._callbacks.onOpen();
  }
}
