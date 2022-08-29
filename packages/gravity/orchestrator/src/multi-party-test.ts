//
// Copyright 2022 DXOS.org
//

import { sleep } from '@dxos/async';
import { NodeContainer } from '@dxos/botkit';
import { Party } from '@dxos/client';
import { range } from '@dxos/util';

import { ITEM_TYPE, SLACK_FOR_BOT_UPDATES_MS, SLEEP_TIME } from './constants';
import { Orchestrator } from './orchestrator';

const isAllFresh = (party: Party) => {
  const now = Date.now();
  const entities = party.database.select({
    type: ITEM_TYPE
  }).exec().entities;
  return entities.every((e) => e.model.getProperty('ts') > now - SLACK_FOR_BOT_UPDATES_MS);
};

const multiItemStress = async () => {
  const orchestrator = new Orchestrator(new NodeContainer(['@swc-node/register']));
  await orchestrator.initialize();

  let botsPerParty = 1;

  let botCount = 0;

  while(true) {
    const party = await orchestrator.client.echo.createParty();

    for(const _ of range(botsPerParty)) {
      const bot = await orchestrator.spawnBot({
        localPath: require.resolve('./isolated-ping-bot')
      }, party);
      console.log(`botCount=${++botCount}`);

      bot.
    }
    
    await sleep(SLEEP_TIME);

    const areAllFresh = orchestrator.client.echo.queryParties().value.every(party => isAllFresh(party));
    if(!areAllFresh) {
      break;
    }
  }

  console.log('done');

  await orchestrator.stop();

};

void multiItemStress();
