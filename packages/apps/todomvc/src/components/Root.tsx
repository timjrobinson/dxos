//
// Copyright 2022 DXOS.org
//

import React from 'react';

import { fromHost, fromIFrame } from '@dxos/client';
import { Config, Defaults, Dynamics, Envs } from '@dxos/config';
import { ClientProvider } from '@dxos/react-client';

import { Main } from './Main';

const configProvider = async () => new Config(await Dynamics(), await Envs(), Defaults());
const servicesProvider = (config?: Config) =>
  config?.get('runtime.app.env.DX_VAULT') === 'false' ? fromHost(config) : fromIFrame(config, { shell: true });

export const Root = () => (
  <ClientProvider config={configProvider} services={servicesProvider}>
    <Main />
  </ClientProvider>
);
