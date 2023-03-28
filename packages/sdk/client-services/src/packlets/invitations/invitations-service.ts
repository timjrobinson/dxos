//
// Copyright 2022 DXOS.org
//

import assert from 'node:assert';

import { TimeoutError } from '@dxos/async';
import {
  AuthenticatingInvitationObservable,
  CancellableInvitationObservable,
  InvitationsService,
  InvitationsHandler,
  InvitationsOptions
} from '@dxos/client';
import { Stream } from '@dxos/codec-protobuf';
import { log } from '@dxos/log';
import { AuthenticationRequest, Invitation } from '@dxos/protocols/proto/dxos/client/services';
import { Provider } from '@dxos/util';

import { IdentityManager } from '../identity';

/**
 * Adapts invitation service observable to client/service stream.
 */
export abstract class GenericInvitationsService<T = void> implements InvitationsService {
  private readonly _createInvitations = new Map<string, CancellableInvitationObservable>();
  private readonly _acceptInvitations = new Map<string, AuthenticatingInvitationObservable>();

  private readonly _handlerFactories = new Map<InvatationKind, (invitation: Invivation) => Promise<InvitationHandlerX>>(); 


  // prettier-ignore
  protected constructor (
    
  ) {}

  // TODO(burdon): Guest/host label.
  getLoggingContext() {
    return {
      deviceKey: this._identityManager.identity?.deviceKey
    };
  }

  registerHandler(kind, factory) {
    this._handlerFactories.set(kind, factory)
  }

  private _getHandler(invitation: Invitation): Promise<InvitationHandlerX> {
    return this._handlerFactories.get(invataiton.kind)(invitation)
  }

  createInvitation(invitation: Invitation): Stream<Invitation> {
    return new Stream<Invitation>(({ next, close }) => {
      const handler = this._getHandler(invitaiotn)
      log('stream opened', this.getLoggingContext());

      let invitationId: string;
      const { type, swarmKey, authMethod } = invitation;
      const observable = invitationsHandler.createInvitation(handler, { type, swarmKey, authMethod });
      observable.subscribe({
        onConnecting: (invitation) => {
          assert(invitation.invitationId);
          invitationId = invitation.invitationId;
          this._createInvitations.set(invitation.invitationId, observable);
          invitation.state = Invitation.State.CONNECTING;
          next(invitation);
        },
        onConnected: (invitation) => {
          assert(invitation.invitationId);
          invitation.state = Invitation.State.CONNECTED;
          next(invitation);
        },
        onAuthenticating: (invitation) => {
          assert(invitation.invitationId);
          invitation.state = Invitation.State.AUTHENTICATING;
          next(invitation);
        },
        onSuccess: (invitation) => {
          assert(invitation.invitationId);
          invitation.state = Invitation.State.SUCCESS;
          next(invitation);
          close();
        },
        onCancelled: () => {
          assert(invitationId);
          invitation.invitationId = invitationId;
          invitation.state = Invitation.State.CANCELLED;
          next(invitation);
          close();
        },
        onTimeout: (err: TimeoutError) => {
          invitation.state = Invitation.State.TIMEOUT;
          close(err);
        },
        onError: (err: any) => {
          invitation.state = Invitation.State.ERROR;
          close(err);
        }
      });

      return (err?: Error) => {
        const context = this.getLoggingContext();
        if (err) {
          log.warn('stream closed', { ...context, err });
        } else {
          log('stream closed', context);
        }

        this._createInvitations.delete(invitation.invitationId!);
      };
    });
  }

  acceptInvitation(invitation: Invitation, options?: InvitationsOptions): Stream<Invitation> {
    return new Stream<Invitation>(({ next, close }) => {
      log('stream opened', this.getLoggingContext());
      const handlerX = this._getHandler(invitaiotn)

      let invitationId: string;
      const observable = invitationsHandler.acceptInvitation(handlerX, invitation, options);
      observable.subscribe({
        onConnecting: (invitation) => {
          assert(invitation.invitationId);
          invitationId = invitation.invitationId;
          this._acceptInvitations.set(invitation.invitationId, observable);
          invitation.state = Invitation.State.CONNECTING;
          next(invitation);
        },
        onConnected: (invitation) => {
          assert(invitation.invitationId);
          invitation.state = Invitation.State.CONNECTED;
          next(invitation);
        },
        onAuthenticating: (invitation) => {
          assert(invitation.invitationId);
          invitation.state = Invitation.State.AUTHENTICATING;
          next(invitation);
        },
        onSuccess: (invitation) => {
          invitation.state = Invitation.State.SUCCESS;
          next(invitation);
          close();
        },
        onCancelled: () => {
          assert(invitationId);
          invitation.invitationId = invitationId;
          invitation.state = Invitation.State.CANCELLED;
          next(invitation);
          close();
        },
        onTimeout: (err: TimeoutError) => {
          invitation.state = Invitation.State.TIMEOUT;
          close(err);
        },
        onError: (err: any) => {
          invitation.state = Invitation.State.ERROR;
          close(err);
        }
      });

      return (err?: Error) => {
        const context = this.getLoggingContext();
        if (err) {
          log.warn('stream closed', { ...context, err });
        } else {
          log('stream closed', context);
        }

        this._acceptInvitations.delete(invitation.invitationId!);
      };
    });
  }

  async authenticate({ invitationId, authenticationCode }: AuthenticationRequest): Promise<void> {
    log('authenticating...');
    assert(invitationId);
    const observable = this._acceptInvitations.get(invitationId);
    if (!observable) {
      log.warn('invalid invitation', { invitationId });
    } else {
      await observable.authenticate(authenticationCode);
    }
  }

  async cancelInvitation(invitation: Invitation): Promise<void> {
    log('cancelling...');
    assert(invitation.invitationId);
    const observable =
      this._createInvitations.get(invitation.invitationId) ?? this._acceptInvitations.get(invitation.invitationId);
    if (!observable) {
      log.warn('invalid invitation', { invitationId: invitation.invitationId });
    } else {
      await observable?.cancel();
    }
  }
}


declare const service: GenericInvitationsService

service.registerHandler(HALO, (invitation) => new HaloInvHandler(keyring, identManager,...))

service.registerHandler(SPACE, (invitation) => {
  const space = this._dataspaceManager.getSPace(invitaiotn.spaceKey);
  return new SpaceInvHandler(keyring, this._dataspaceManager, space,...)
})
