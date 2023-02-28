//
// Copyright 2023 DXOS.org
//

import '@dxosTheme';
import { faker } from '@faker-js/faker';
import { Intersect, Laptop, Planet, Plus, PlusCircle, QrCode } from 'phosphor-react';
import React, { useMemo, useState } from 'react';

import { Space, SpaceProxy, useClient, useIdentity, useSpaces } from '@dxos/react-client';
import { ClientDecorator } from '@dxos/react-client/testing';
import { Button, ButtonGroup, getSize, Group } from '@dxos/react-components';

import { IdentityListItem, SpaceListItem } from '../components';
import { DevicesPanel, JoinPanel, SpacePanel } from '../panels';

export default {
  title: 'Invitations'
};

export type PanelType = Space | 'identity' | 'devices' | 'join';

const createInvitationUrl = (invitation: string) => invitation;

const Panel = ({ id, panel, setPanel }: { id: number; panel?: PanelType; setPanel: (panel?: PanelType) => void }) => {
  const client = useClient();
  const spaces = useSpaces();

  useMemo(() => {
    if (panel instanceof SpaceProxy) {
      (window as any)[`peer${id}space`] = panel;
    }
  }, [panel]);

  if (panel instanceof SpaceProxy) {
    return <SpacePanel space={panel} createInvitationUrl={createInvitationUrl} />;
  }

  switch (panel) {
    case 'identity': {
      return <JoinPanel mode='halo-only' onDone={() => setPanel(undefined)} onExit={() => setPanel(undefined)} />;
    }

    case 'devices': {
      return <DevicesPanel createInvitationUrl={createInvitationUrl} onDone={() => setPanel(undefined)} />;
    }

    case 'join': {
      return <JoinPanel onDone={() => setPanel(undefined)} onExit={() => setPanel(undefined)} />;
    }

    default: {
      // TODO(wittjosiah): Tooltips make playwright (webkit) flakier.
      const controls = (
        <ButtonGroup className='mbe-4'>
          {/* <Tooltip content='Create Space'> */}
          <Button
            onClick={() => client.echo.createSpace({ name: faker.animal.bird() })}
            data-testid='invitations.create-space'
          >
            <PlusCircle className={getSize(6)} />
          </Button>
          {/* </Tooltip>
          <Tooltip content='Join Space'> */}
          <Button onClick={() => setPanel('join')} data-testid='invitations.open-join-space'>
            <Intersect weight='fill' className={getSize(6)} />
          </Button>
          {/* </Tooltip> */}
        </ButtonGroup>
      );

      const header = (
        <div className='flex'>
          Spaces
          <span className='grow' />
          {controls}
        </div>
      );

      return (
        <Group label={{ children: header }}>
          <ul>
            {spaces.length > 0 ? (
              spaces.map((space) => (
                <SpaceListItem key={space.key.toHex()} space={space} onClick={() => setPanel(space)} />
              ))
            ) : (
              <div className='text-center'>No spaces</div>
            )}
          </ul>
        </Group>
      );
    }
  }
};

const render = ({ id }: { id: number }) => {
  const client = useClient();
  const identity = useIdentity();
  const [panel, setPanel] = useState<PanelType>();

  useMemo(() => {
    (window as any)[`peer${id}client`] = client;
  }, [client]);

  // TODO(wittjosiah): Tooltips make playwright (webkit) flakier.
  const controls = (
    <ButtonGroup className='mbe-4'>
      {/* <Tooltip content='Create Identity'> */}
      <Button
        onClick={() => client.halo.createIdentity({ displayName: faker.name.firstName() })}
        disabled={Boolean(identity)}
        data-testid='invitations.create-identity'
      >
        <Plus className={getSize(6)} />
      </Button>
      {/* </Tooltip>
      <Tooltip content='Join Existing Identity'> */}
      <Button
        onClick={() => setPanel('identity')}
        disabled={panel === 'identity'}
        data-testid='invitations.open-join-identity'
      >
        <QrCode weight='fill' className={getSize(6)} />
      </Button>
      {/* </Tooltip>
      <Tooltip content='Devices'> */}
      <Button
        onClick={() => setPanel('devices')}
        disabled={!identity || panel === 'devices'}
        data-testid='invitations.open-devices'
      >
        <Laptop weight='fill' className={getSize(6)} />
      </Button>
      {/* </Tooltip>
      <Tooltip content='List Spaces'> */}
      <Button onClick={() => setPanel(undefined)} disabled={!panel} data-testid='invitations.list-spaces'>
        <Planet weight='fill' className={getSize(6)} />
      </Button>
      {/* </Tooltip> */}
    </ButtonGroup>
  );

  const header = (
    <div className='flex' data-testid='invitations.identity-header'>
      Identity
      <span className='grow' />
      {controls}
    </div>
  );

  return (
    <div className='flex flex-col p-4 flex-1 min-w-0' data-testid={`peer-${id}`}>
      <Group label={{ children: header }} className='mbe-2'>
        {identity ? <IdentityListItem identity={identity} /> : <div className='text-center'>No identity</div>}
      </Group>
      {identity || panel ? <Panel id={id} panel={panel} setPanel={setPanel} /> : null}
    </div>
  );
};

export const Default = {
  render,
  decorators: [ClientDecorator({ count: 3 })]
};
