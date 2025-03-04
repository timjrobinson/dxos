//
// Copyright 2023 DXOS.org
//

import type { Config as ImapConfig } from 'imap';

import { Message as MessageType, Mailbox as MailboxType } from '@braneframe/types';
import { getSpaceForObject } from '@dxos/client/echo';
import { type Space } from '@dxos/client/echo';
import { matchKeys } from '@dxos/echo-schema';
import { type FunctionHandler } from '@dxos/functions';
import { invariant } from '@dxos/invariant';
import { PublicKey } from '@dxos/keys';
import { log } from '@dxos/log';

import { ImapProcessor } from './imap-processor';
import { getKey } from '../../util';

export const handler: FunctionHandler<any> = async ({
  event: { space: spaceKey, objects: mailboxIds },
  context: { client },
  response,
}) => {
  // TODO(burdon): Generalize util for getting properties from config/env.
  const config = client.config;
  const imapConfig: ImapConfig = {
    user: process.env.COM_PROTONMAIL_USERNAME ?? getKey(config, 'protonmail.com/username')!,
    password: process.env.COM_PROTONMAIL_PASSWORD ?? getKey(config, 'protonmail.com/password')!,
    host: process.env.COM_PROTONMAIL_HOST ?? '127.0.0.1',
    port: process.env.COM_PROTONMAIL_PORT ? parseInt(process.env.COM_PROTONMAIL_PORT) : 1143,
    tls: false,
    tlsOptions: {
      // ca: process.env.COM_PROTONMAIL_CERT ?? getKey(config, 'protonmail.com/ca'),
      rejectUnauthorized: false,
    },
  };

  const processor = new ImapProcessor('protonmail.com', imapConfig);

  let code = 200;
  try {
    const mailboxes: MailboxType[] = [];
    if (spaceKey) {
      const space = client.spaces.get(PublicKey.from(spaceKey))!;
      const { objects } = space.db.query(MailboxType.filter());
      mailboxes.push(...objects);
    } else {
      const { objects } = client.experimental.graph.query(MailboxType.filter());
      mailboxes.push(...objects);
    }

    if (mailboxes.length) {
      await processor.connect();

      for (const mailbox of mailboxes) {
        const space = getSpaceForObject(mailbox);
        invariant(space);
        // TODO(burdon): Debounce requests (i.e., store seq).
        log('requesting messages...');
        const messages = await processor.requestMessages({ days: 60 });
        await processMailbox(space, mailbox, messages);
      }
    }
  } catch (err: any) {
    log.error(err);
    code = 500;
  } finally {
    await processor.disconnect();
  }

  return response.status(code);
};

// TODO(burdon): Util.
const processMailbox = async (space: Space, mailbox: MailboxType, messages: MessageType[]) => {
  const { objects: current = [] } = space.db.query(MessageType.filter()) ?? {};

  // Merge messages.
  // console.log(messages.map((message) => message[debug]));
  let added = 0;
  for (const message of messages) {
    if (!current.find((m) => matchKeys(m.__meta.keys, message.__meta.keys))) {
      mailbox.messages.push(message);
      added++;
    }
  }

  log('processed', { messages: messages.length, added });
};
