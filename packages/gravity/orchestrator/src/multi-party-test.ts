//
// Copyright 2022 DXOS.org
//

import { sleep } from '@dxos/async';
import { NodeContainer } from '@dxos/botkit';
import { Client } from '@dxos/client/client';

import { SLEEP_TIME } from './constants';
import { Orchestrator } from './orchestrator';


const MAX_MSG_BEHIND = 15;

const multiItemStress = async () => {
  const orchestrator = new Orchestrator(new NodeContainer(['@swc-node/register']));
  await orchestrator.initialize();

  let botsPerParty = 2;

  let botCount = 0;

  while(true) {
    let lags: Array<number>;

    const client = new Client(orchestrator.config);
    await client.initialize()
    await client.halo.createProfile()

    const party = await client.echo.createParty();
    
    let currentBotCount = 0;
    while(currentBotCount < botsPerParty) {
      try {
        await orchestrator.spawnBot({
          localPath: require.resolve('./isolated-ping-bot')
        }, party);
        currentBotCount++
        botCount++;
      } catch {
        console.log(`Failed to spawn bot`)
      }
      console.log(`botCount=${botCount}`);
    }

    await sleep(SLEEP_TIME);
    await client.destroy()
    
    lags = await orchestrator.checkLag()
    const maxLag = Math.max(...lags)
    console.log(`maxLag=${maxLag}`)
    const areAllFresh = maxLag < MAX_MSG_BEHIND;
    if(!areAllFresh) {
      break;
    }
  }

  console.log('done');

  await orchestrator.stop();

};

void multiItemStress();
