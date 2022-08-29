//
// Copyright 2022 DXOS.org
//

import { exec } from 'child_process';
import { Encoder, Parser } from 'fringe';
import { createServer } from 'net';

import { Event } from '@dxos/async';
import { RpcPort } from '@dxos/rpc';

import { BotContainer, BotExitStatus, SpawnOptions } from './bot-container';

export class DockerContainer implements BotContainer {
  error = new Event<[id: string, error: Error]>();
  exited = new Event<[id: string, status: BotExitStatus]>();
  private _spawned: Array<string> = [];

  spawn (opts: SpawnOptions): Promise<RpcPort> {
    exec('docker exec ');
  }

  kill (id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  killAll (): void {
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
