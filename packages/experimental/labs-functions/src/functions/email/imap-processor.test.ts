//
// Copyright 2023 DXOS.org
//

import { expect } from 'chai';

import { describe, test } from '@dxos/test';

import { ImapProcessor } from './imap-processor';
import { getConfig, getKey } from '../../util';

// eslint-disable-next-line mocha/no-skipped-tests
describe.skip('IMAP processor', () => {
  let processor: ImapProcessor | undefined;

  before(async () => {
    const config = getConfig()!;
    processor = new ImapProcessor('protonmail.com', {
      user: process.env.COM_PROTONMAIL_USERNAME ?? getKey(config, 'protonmail.com/username')!,
      password: process.env.COM_PROTONMAIL_PASSWORD ?? getKey(config, 'protonmail.com/password')!,
      host: process.env.COM_PROTONMAIL_HOST ?? '127.0.0.1',
      port: process.env.COM_PROTONMAIL_PORT ? parseInt(process.env.COM_PROTONMAIL_PORT) : 1143,
      tls: true,
      tlsOptions: {
        // ca: process.env.COM_PROTONMAIL_CERT ?? getKey(config, 'protonmail.com/ca'),
        rejectUnauthorized: false,
      },
    });

    await processor.connect();
  });

  after(async () => {
    await processor?.disconnect();
  });

  // eslint-disable-next-line mocha/no-skipped-tests
  test('basic', async () => {
    const messages = await processor!.requestMessages();

    const mapped = messages
      .map((message) => ({
        date: message.date,
        to: message.to[0]?.email,
        from: message.from?.email,
        subject: message.subject,
        body: message.blocks[0].text?.length,
      }))
      .sort(({ date: a }, { date: b }) => (a < b ? 1 : a > b ? -1 : 0));

    console.log('messages', JSON.stringify(mapped, undefined, 2));
    expect(mapped).to.have.length.greaterThan(0);
  });
});
