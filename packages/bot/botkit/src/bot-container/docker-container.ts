//
// Copyright 2022 DXOS.org
//

import { exec } from 'child_process';
import { Encoder, Parser } from 'fringe';
import { createServer } from 'net';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';

import { Event } from '@dxos/async';
import { RpcPort } from '@dxos/rpc';

import { BotContainer, BotExitStatus, SpawnOptions } from './bot-container';

export class DockerContainer implements BotContainer {
  error = new Event<[id: string, error: Error]>();
  exited = new Event<[id: string, status: BotExitStatus]>();
  private _spawned: Array<string> = [];

  async spawn (opts: SpawnOptions): Promise<RpcPort> {
    const sockPath = join(tmpdir(), `${opts.id}.sock`);
    const sock = createUnixServerRpcPort(sockPath);
    try {
      await promisify(exec)(`docker run -v ${opts.localPath}:/bundle.js -v ${sockPath}:/bot.sock --name dxos_bot_${opts.id} botkit node /bundle.js`);
    } catch (e) {
      console.log(e);
      throw e;
    }
    return sock;
  }

  async kill (id: string): Promise<void> {
    await promisify(exec)(`docker stop dxos_bot_${id}`);
  }

  async killAll (): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

export const createUnixServerRpcPort = (path: string): RpcPort => {
  const encoder = new Encoder();
  const parser = new Parser();
  const socket = createServer((conn) => {
    encoder.pipe(conn);
    conn.pipe(parser);
  });
  socket.listen(path);
  return {
    send: (msg) => encoder.write(msg),
    subscribe: cb => {
      parser.on('message', cb);
      return () => parser.off('message', cb);
    }
  };
};
