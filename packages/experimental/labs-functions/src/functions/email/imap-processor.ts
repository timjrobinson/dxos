//
// Copyright 2023 DXOS.org
//

import sub from 'date-fns/sub';
import { convert } from 'html-to-text';
import { type Config as ImapConfig } from 'imap';
import imaps, { type Message as ImapMessage, type ImapSimple } from 'imap-simple';
import { simpleParser, type EmailAddress } from 'mailparser';

import { Message as MessageType } from '@braneframe/types';
import { invariant } from '@dxos/invariant';
import { log } from '@dxos/log';

const toArray = (value: any) => (Array.isArray(value) ? value : [value]);

// Protonmail bridge (local IMAP server) as alternative to Gmail, which requires a registered Google workspace.
// https://proton.me/blog/bridge-security-model
// NOTE: Configure bridge settings: SSL; download the cert.

// TODO(burdon): Object with spam and block list arrays.
const ignoreMatchingEmail = [/noreply/, /no-reply/, /notifications/, /billing/, /support/];

export class ImapProcessor {
  private _connection?: ImapSimple;

  // prettier-ignore
  constructor(
    private readonly _id: string,
    private readonly _config: ImapConfig,
  ) {
    invariant(this._id);
    invariant(this._config);
  }

  // https://www.npmjs.com/package/imap-simple
  async connect() {
    if (!this._connection) {
      log('connecting...', { config: this._config });
      this._connection = await imaps.connect({ imap: this._config! });
      await this._connection.openBox('INBOX');
      log('connected');
    }
  }

  async disconnect() {
    if (this._connection) {
      log('disconnecting...');
      this._connection.end();
      this._connection = undefined;
      log('disconnected');
    }
  }

  /**
   * Make IMAP request.
   */
  // TODO(burdon): Request since timestamp.
  async requestMessages({ days }: { days: number } = { days: 28 }): Promise<MessageType[]> {
    log('requesting...', { days });

    // https://github.com/mscdex/node-imap
    const messages = await this._connection!.search(['ALL', ['SINCE', sub(Date.now(), { days })]], {
      bodies: [''],
      markSeen: false,
    });

    const parsedMessage = await this.parseMessages(messages);
    log('parsed', { messages: parsedMessage.length });
    return parsedMessage;
  }

  /**
   * Parse raw IMAP messages.
   */
  private async parseMessages(rawMessages: ImapMessage[]): Promise<MessageType[]> {
    log('parsing', { messages: rawMessages.length });

    const messages = await Promise.all(
      rawMessages.map(async (raw): Promise<MessageType | undefined> => {
        // https://nodemailer.com/extras/mailparser
        const input: string = raw.parts[0].body;
        const { messageId, date, from, to, subject, text, textAsHtml } = await simpleParser(input);
        if (!messageId || !date || !from || !to || !subject) {
          return;
        }

        const toRecipient = ({ address: email, name }: EmailAddress): MessageType.Recipient => ({
          email,
          name: name?.length ? name : undefined,
        });

        const message = new MessageType(
          {
            date: date.toISOString(),
            from: toRecipient(from.value[0]),
            to: toArray(to).map((to) => toRecipient(to.value[0])),
            subject,
          },
          {
            meta: { keys: [{ source: this._id, id: messageId }] },
          },
        );

        // Skip bulk mail.
        if (!message.from?.email || ignoreMatchingEmail.some((regex) => regex.test(message.from!.email!))) {
          return;
        }

        // TODO(burdon): Custom parsing (e.g., remove links, images).
        // https://www.npmjs.com/package/html-to-text
        let body = text ?? '';
        if (textAsHtml) {
          let str = convert(textAsHtml, {
            selectors: [
              { selector: 'a', format: 'skip' },
              { selector: 'img', format: 'skip' },
            ],
          });

          // TODO(burdon): Heuristics.
          {
            // TODO(burdon): Remove brackets around removed links/images.
            str = str.replace(/\[\]/g, '');

            // Remove multiple newlines.
            str = str.replace(/\n+/g, '\n');
          }
          {
            // Spam.
            const idx = str.indexOf('unsubscribe');
            if (idx !== -1) {
              return undefined;
            }
          }
          {
            const idx = str.indexOf('---------- Forwarded message ---------');
            if (idx !== -1) {
              str = str.slice(0, idx);
            }
          }

          body = str;
        }

        message.blocks = [{ text: body }];
        return message;
      }),
    );

    return messages.filter(Boolean) as MessageType[];
  }
}
