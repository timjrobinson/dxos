//
// Copyright 2023 DXOS.org
//

import React, { useEffect, useState } from 'react';

import { log } from '@dxos/log';
import { LayoutRequest, ShellDisplay, ShellLayout, ShellRuntime, useClient } from '@dxos/react-client';
import { useSpace, useSpaces } from '@dxos/react-client/echo';

import { IdentityDialog } from '../IdentityDialog';
import { JoinDialog } from '../JoinDialog';
import { SpaceDialog } from '../SpaceDialog';

export const Shell = ({ runtime, origin }: { runtime: ShellRuntime; origin: string }) => {
  const [{ layout, invitationCode, spaceKey }, setLayout] = useState<LayoutRequest>({
    layout: runtime.layout,
    invitationCode: runtime.invitationCode,
    spaceKey: runtime.spaceKey,
  });

  const client = useClient();
  const spaces = useSpaces({ all: true });
  const space = useSpace(spaceKey);

  useEffect(() => {
    return runtime.layoutUpdate.on((request) => setLayout(request));
  }, [runtime]);

  useEffect(() => {
    if (layout === ShellLayout.SPACE_INVITATIONS && !space) {
      log.warn('No space found for shell space invitations.');

      const timeout = setTimeout(async () => {
        await runtime.setAppContext({ display: ShellDisplay.NONE });
        runtime.setLayout(ShellLayout.DEFAULT);
      });

      return () => clearTimeout(timeout);
    }
  }, [runtime, layout, space]);

  switch (layout) {
    case ShellLayout.INITIALIZE_IDENTITY:
      return (
        <JoinDialog
          mode='halo-only'
          initialInvitationCode={invitationCode}
          onDone={() => {
            void runtime.setAppContext({ display: ShellDisplay.NONE });
            runtime.setLayout(ShellLayout.DEFAULT);
            // TODO(wittjosiah): Support this first-class inside client?
            if (spaces.length === 0) {
              void client.createSpace();
            }
          }}
        />
      );

    case ShellLayout.DEVICE_INVITATIONS:
      return (
        <IdentityDialog
          createInvitationUrl={(invitationCode) => `${origin}?deviceInvitationCode=${invitationCode}`}
          onDone={async () => {
            await runtime.setAppContext({ display: ShellDisplay.NONE });
            runtime.setLayout(ShellLayout.DEFAULT);
          }}
        />
      );

    case ShellLayout.SPACE_INVITATIONS:
      return space ? (
        <SpaceDialog
          space={space}
          createInvitationUrl={(invitationCode) => `${origin}?spaceInvitationCode=${invitationCode}`}
          onDone={async () => {
            await runtime.setAppContext({ display: ShellDisplay.NONE });
            runtime.setLayout(ShellLayout.DEFAULT);
          }}
        />
      ) : null;

    case ShellLayout.JOIN_SPACE:
      return (
        <JoinDialog
          initialInvitationCode={invitationCode}
          onInvalidateInvitationCode={async (code: string) => {
            await runtime.setAppContext({ invalidatedInvitationCode: code });
          }}
          onDone={async (result) => {
            await runtime.setAppContext({ display: ShellDisplay.NONE, spaceKey: result?.spaceKey ?? undefined });
            runtime.setLayout(ShellLayout.DEFAULT);
          }}
          onExit={async () => {
            await runtime.setAppContext({ display: ShellDisplay.NONE });
            runtime.setLayout(ShellLayout.DEFAULT);
          }}
        />
      );

    default:
      return null;
  }
};
