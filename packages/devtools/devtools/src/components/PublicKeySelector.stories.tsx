//
// Copyright 2023 DXOS.org
//

import '@dxosTheme';

import React from 'react';

import { PublicKey } from '@dxos/keys';
import { Toolbar } from '@dxos/react-ui';

import { PublicKeySelector } from './PublicKeySelector';

export default {
  component: PublicKeySelector,
  actions: { argTypesRegex: '^on.*' },
};

export const Normal = (props: any) => {
  return (
    <Toolbar.Root>
      <PublicKeySelector keys={[PublicKey.random(), PublicKey.random()]} {...props} />
    </Toolbar.Root>
  );
};
