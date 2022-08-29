//
// Copyright 2022 DXOS.org
//

import { Encoder, Parser } from 'fringe';
import { createConnection, createServer } from 'net';

import { RpcPort } from '@dxos/rpc';

export const createSocketClientRpcPort = (port: number, host: string): RpcPort => {
  const encoder = new Encoder();
  const parser = new Parser();
  console.log({ port, host });
  const socket = createConnection(port, host);
  encoder.pipe(socket);
  socket.pipe(parser);
  socket.on('connect', () => {
    console.log('CONNECTED!')
  })
  socket.on('data', msg => {
    console.log('DATA', msg)
  })
  return {
    send: (msg) => {
      console.log('SEND', msg);
      encoder.write(msg)
    },
    subscribe: cb => {
      console.log('SUBSCRIBE')
      parser.on('message', (data: any) => {
        console.log('MESSAGE', data);
        cb(data)
      })
      return () => parser.off('message', cb);
    }
  };
};

export const createSocketServerRpcPort = (port: number): RpcPort => {
  const encoder = new Encoder();
  const parser = new Parser();
  const socket = createServer((conn) => {
    console.log('CONNECTED!')

    encoder.pipe(conn);
    conn.pipe(parser);
  });
  console.log('LISTENING ON', port);
  socket.listen(port, '0.0.0.0');
  return {
    send: (msg) => {
      console.log('SEND', msg)
      encoder.write(msg)
    },
    subscribe: cb => {
      parser.on('message', (data: any) => {
        console.log(`Socket got smthing: ${data}`)
        cb(data);
      });
      return () => parser.off('message', cb);
    }
  };
};
