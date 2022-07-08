//
// Copyright 2021 DXOS.org
//

import { NodeStorage } from './implementations/node-storage';
import { RamStorage } from './implementations/ram-storage';
import { Storage } from './interfaces/Storage';
import { StorageType } from './interfaces/storage-types';

export const createStorage = (
  root: string, // TODO(burdon): Should be options since not required for memory.
  type?: StorageType
): Storage => {
  // TODO(burdon): Change to switch statement.
  if (type === undefined) {
    return new NodeStorage(root);
  }
  if (type === StorageType.RAM) {
    return new RamStorage(root);
  }
  if (type === StorageType.NODE) {
    return new NodeStorage(root);
  }

  throw new Error(`Unsupported storage: ${type}`);
};
