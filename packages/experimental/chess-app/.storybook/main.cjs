const { mergeConfig } = require('vite');
const { resolve } = require('path');

// const { ConfigPlugin } = require('@dxos/config/vite-plugin');
// const { ThemePlugin } = require('@dxos/react-components/plugin');

module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    'storybook-dark-mode'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  viteFinal: async (config) =>
    mergeConfig(config, {
      optimizeDeps: {
        force: true,
        include: [
          '@dxos/client',
          '@dxos/config',
          '@dxos/debug',
          '@dxos/log',
          '@dxos/react-components',
          'storybook-dark-mode'
        ]
      },
      build: {
        commonjsOptions: {
          include: [/packages/, /node_modules/]
        }
      },
      plugins: [
        // ConfigPlugin(),
        // ThemePlugin({
        //   content: [resolve(__dirname, '../src') + '/**/*.{ts,tsx,js,jsx}']
        // })
      ]
    })
};
