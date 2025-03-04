//
// Copyright 2022 DXOS.org
//

import '@dxosTheme';

import { Tag } from './Tag';

export default {
  component: Tag,
  argTypes: {
    palette: {
      control: 'select',
      options: [
        'neutral',
        'success',
        'info',
        'warning',
        'error',
        'red',
        'orange',
        'amber',
        'yellow',
        'lime',
        'green',
        'emerald',
        'teal',
        'cyan',
        'sky',
        'blue',
        'indigo',
        'violet',
        'purple',
        'fuchsia',
        'pink',
        'rose',
      ],
    },
  },
} as any;

export const Default = { args: { children: 'Hello', palette: 'success' } };
