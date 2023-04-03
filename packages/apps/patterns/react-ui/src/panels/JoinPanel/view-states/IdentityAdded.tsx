//
// Copyright 2023 DXOS.org
//

import { CaretLeft, CaretRight, Check } from '@phosphor-icons/react';
import React, { cloneElement } from 'react';

import type { Identity } from '@dxos/client';
import { InvitationResult } from '@dxos/react-client';
import { Avatar, getSize, mx, useTranslation } from '@dxos/react-components';
import { Content, Button, Heading } from '../../Panel';

import { JoinPanelMode } from '../JoinPanelProps';
import { ViewState, ViewStateHeading, ViewStateProps } from './ViewState';

export interface IdentityAddedProps extends ViewStateProps, DoneProps {
  mode?: JoinPanelMode;
  addedIdentity?: Identity;
}

export interface DoneProps extends ViewStateProps {
  doneActionParent?: Parameters<typeof cloneElement>[0];
  onDone?: (result: InvitationResult | null) => void;
}

const Done = ({ onDone, doneActionParent, active }: DoneProps) => {
  const disabled = !active;
  const { t } = useTranslation('os');

  const doneButton = (
    <Button
      {...(onDone && { onClick: () => onDone(null) })}
      disabled={disabled}
      data-autofocus='confirmingAddedIdentity'
      data-testid='identity-added-done'
    >
      <span className='grow'>{t('done label')}</span>
    </Button>
  );

  return doneActionParent ? cloneElement(doneActionParent, {}, doneButton) : doneButton;
};

export const IdentityAdded = ({
  mode,
  addedIdentity,
  onDone,
  doneActionParent,
  ...viewStateProps
}: IdentityAddedProps) => {
  const disabled = !viewStateProps.active;
  const { joinSend } = viewStateProps;
  const { t } = useTranslation('os');

  return (
    <ViewState {...viewStateProps}>
      <Heading className='mbs-0'>{t('identity added label')}</Heading>
      <div role='none' className='grow flex flex-col items-center justify-center text-center gap-2'>
        <Avatar
          size={20}
          fallbackValue={addedIdentity?.identityKey.toHex() ?? ''}
          label={
            <p className={mx('text-lg', !addedIdentity?.profile?.displayName && 'font-mono')}>
              {addedIdentity?.profile?.displayName ?? addedIdentity?.identityKey.truncate() ?? ' '}
            </p>
          }
          variant='circle'
          status='active'
        />
      </div>
      {mode === 'halo-only' ? (
        <Done onDone={onDone} doneActionParent={doneActionParent} {...viewStateProps} />
      ) : (
        <div className='flex gap-2'>
          <Button
            disabled={disabled || !addedIdentity}
            className='grow flex items-center gap-2 pli-2 order-2'
            onClick={() => addedIdentity && joinSend({ type: 'selectIdentity', identity: addedIdentity })}
            data-autofocus='confirmingAddedIdentity'
          >
            <CaretLeft weight='bold' className={mx(getSize(2), 'invisible')} />
            <span className='grow'>{t('continue label')}</span>
            <CaretRight weight='bold' className={getSize(4)} />
          </Button>
          <Button
            disabled={disabled}
            onClick={() => joinSend({ type: 'deselectAuthMethod' })}
            className='flex items-center gap-2 pis-2 pie-4'
          >
            <CaretLeft weight='bold' className={getSize(4)} />
            <span>{t('deselect identity label')}</span>
          </Button>
        </div>
      )}
    </ViewState>
  );
};
