//
// Copyright 2022 DXOS.org
//

import { Encoder, Parser } from 'fringe';
import { createConnection } from 'net';

import { RpcPort } from '@dxos/rpc';

export const createUnixClientRpcPort = (path: string): RpcPort => {
  const encoder = new Encoder();
  const parser = new Parser();
  const socket = createConnection(path);
  encoder.pipe(socket);
  socket.pipe(parser);
  return {
    send: (msg) => encoder.write(msg),
    subscribe: cb => {
      parser.on('message', cb);
      return () => parser.off('message', cb);
    }
  };
};
