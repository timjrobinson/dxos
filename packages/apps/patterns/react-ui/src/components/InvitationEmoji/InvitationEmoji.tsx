//
// Copyright 2023 DXOS.org
//

import React, { ComponentPropsWithoutRef } from 'react';

import { getSize, mx } from '@dxos/react-components';

import { toEmoji } from '../../util';

export type InvitationEmojiProps = {
  invitationId?: string;
  size?: 'lg' | 'sm';
} & ComponentPropsWithoutRef<'div'>;

export const InvitationEmoji = ({ invitationId, size = 'lg', ...rootProps }: InvitationEmojiProps) => {
  const invitationEmoji = invitationId && toEmoji(invitationId);
  return (
    <div
      role='none'
      {...rootProps}
      className={mx(
        getSize(size === 'sm' ? 8 : 12),
        'inline-flex items-center justify-center leading-none shrink-0',
        size === 'sm'
          ? 'text-2xl'
          : 'text-5xl bg-neutral-500 rounded-full bg-gradient-radial from-neutral-200 to-neutral-500 dark:from-neutral-600 dark:to-neutral-850',
        rootProps.className
      )}
    >
      <span role='none'>{invitationEmoji}</span>
    </div>
  );
};
