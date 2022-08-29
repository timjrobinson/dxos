//
// Copyright 2022 DXOS.org
//

import assert from 'node:assert';

import { BotFactoryClient } from '@dxos/bot-factory-client';
import { BotContainer, BotController, BotFactory, BotPackageSpecifier } from '@dxos/botkit';
import { Party } from '@dxos/client';
import { Client } from '@dxos/client/client';
import { Config } from '@dxos/config';
import { NetworkManager } from '@dxos/network-manager';
import { PublicKey, Timeframe } from '@dxos/protocols';
import { createTestBroker, TestBroker } from '@dxos/signal';
import { boolGuard, randomInt } from '@dxos/util';

export class Orchestrator {
  private _client: Client | undefined;
  private _botFactoryClient = new BotFactoryClient(new NetworkManager());
  private _config?: Config;
  private _broker?: TestBroker;

  constructor (
    private readonly _botContainer: BotContainer
  ) { }

  get client(): Client {
    assert(this._client);
    return this._client;
  }

  get botFactoryClient (): BotFactoryClient {
    return this._botFactoryClient;
  }

  async initialize () {
    const port = randomInt(40000, 10000);
    this._broker = await createTestBroker(port);
    this._config = new Config({
      version: 1,
      runtime: {
        services: {
          signal: {
            server: this._broker.url()
          }
        }
      }
    });

    this._client = new Client(this._config);
    await this._client.initialize();
    await this._client.halo.createProfile();

    const topic = PublicKey.random();

    const botFactory = new BotFactory({ config: this._config, botContainer: this._botContainer });
    const botController = new BotController(botFactory, new NetworkManager());
    await botController.start(topic);
    await this._botFactoryClient.start(topic);
  }

  async stop () {
    await this._botFactoryClient.botFactory.removeAll();
    await this._botFactoryClient.stop();
    await this._client?.destroy();
    await this._broker?.stop();
  }

  async spawnBot (botPackageSpecifier: BotPackageSpecifier, party: Party) {
    return await this._botFactoryClient.spawn(botPackageSpecifier, party);
  }

  async checkBots() {
    const bots = await this._botFactoryClient.getBots()

    const parties = new Set(bots.map(bot => bot.partyKey).filter(boolGuard))

    for(const party of parties) {
      const botsForParty = bots.filter(bot => bot.partyKey && bot.partyKey.equals(party))

      const maximalTiemframe = Timeframe.merge(
        ...botsForParty.map(b => b.report?.partyDetails?.processedTimeframe)
      )
    }




    bots.forEach(bot => {
      bot.report?.partyDetails?.processedTimeframe
    })
  }
}
