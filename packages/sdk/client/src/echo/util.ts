// TODO(burdon): Factor out to spaces.
//
// Copyright 2023 DXOS.org
//

import { type Space } from '@dxos/client-protocol';
import { DocumentModel } from '@dxos/document-model';
import { type EchoObject, getDatabaseFromObject } from '@dxos/echo-schema';
import { ModelFactory } from '@dxos/model-factory';
import { TextModel } from '@dxos/text-model';

import { SpaceProxy } from './space-proxy';

export const createDefaultModelFactory = () => {
  return new ModelFactory().registerModel(DocumentModel).registerModel(TextModel);
};

/**
 * @deprecated
 */
export const getSpaceForObject = (object: EchoObject): Space | undefined => {
  const db = getDatabaseFromObject(object);
  const key = db?._backend.spaceKey;
  if (key) {
    const owner = db.graph._getOwningObject(key);
    if (owner instanceof SpaceProxy) {
      return owner;
    }
  }

  return undefined;
};
