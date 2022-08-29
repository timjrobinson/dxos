//
// Copyright 2022 DXOS.org
//

import { tmpdir } from 'os';
import { join } from 'path';

import { sleep } from '@dxos/async';
import { DockerContainer } from '@dxos/botkit';
import { buildBot } from '@dxos/botkit/dist/src/botkit';
import { Client } from '@dxos/client/client';

import { SLEEP_TIME } from './constants';
import { Orchestrator } from './orchestrator';

const MAX_MSG_BEHIND = 15;

const multiItemStress = async () => {
  const bundlePath = join(tmpdir(), 'isolated-ping-bot-bundle.js');
  await buildBot({
    entryPoint: require.resolve('./isolated-ping-bot'),
    outfile: bundlePath
  });

  console.log(bundlePath);

  const orchestrator = new Orchestrator(new DockerContainer());
  await orchestrator.initialize();

  const botsPerParty = 2;

  let botCount = 0;

  while (true) {
    const client = new Client(orchestrator.config);
    await client.initialize();
    await client.halo.createProfile();

    const party = await client.echo.createParty();

    let currentBotCount = 0;
    while (currentBotCount < botsPerParty) {
      try {
        await orchestrator.spawnBot({
          localPath: bundlePath
        }, party);
        currentBotCount++;
        botCount++;
      } catch {
        console.log('Failed to spawn bot');
      }
      console.log(`botCount=${botCount}`);
    }

    await sleep(SLEEP_TIME);
    await client.destroy();

    const lags = await orchestrator.checkLag();
    const maxLag = Math.max(...lags);
    console.log(`maxLag=${maxLag}`);
    const areAllFresh = maxLag < MAX_MSG_BEHIND;
    if (!areAllFresh) {
      break;
    }
  }

  console.log('done');

  await orchestrator.stop();

};

void multiItemStress();
