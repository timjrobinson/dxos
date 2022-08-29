//
// Copyright 2022 DXOS.org
//

import { exec } from 'child_process';
import { Encoder, Parser } from 'fringe';
import { createServer } from 'net';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';

import { Event, sleep } from '@dxos/async';
import { RpcPort } from '@dxos/rpc';

import { BotContainer, BotExitStatus, SpawnOptions } from './bot-container';
import { createSocketClientRpcPort } from '../bots/socket-rpc-port';

export class DockerContainer implements BotContainer {
  error = new Event<[id: string, error: Error]>();
  exited = new Event<[id: string, status: BotExitStatus]>();
  private _spawned: Array<string> = [];

  async spawn (opts: SpawnOptions): Promise<RpcPort> {

    const randomPort = Math.floor(Math.random() * (65535 - 1024) + 1024);

    try {
      await promisify(exec)(`docker run --rm --expose=1337 -p ${randomPort}:1337 -d -v ${opts.localPath}:/bundle.js --name dxos_bot_${opts.id} botkit node /bundle.js`);
    } catch (e) {
      console.log(e);
      throw e;
    }

    // let ip!: string;
    // try {
    //   const { stdout: ip2 } = await promisify(exec)(`docker inspect --format '{{ .NetworkSettings.IPAddress }}' dxos_bot_${opts.id}`);
    //   ip = ip2.trim();
    //   console.log({ ip })
    // } catch (e) {
    //   console.log(e);
    //   throw e;
    // }

    await sleep(100)

    return createSocketClientRpcPort(randomPort, '127.0.0.1');
  }

  async kill (id: string): Promise<void> {
    await promisify(exec)(`docker stop dxos_bot_${id}`);
  }

  async killAll (): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

