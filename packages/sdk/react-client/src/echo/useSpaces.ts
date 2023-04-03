//
// Copyright 2020 DXOS.org
//

import { useEffect, useRef, useState } from 'react';

import { Space, SpaceState } from '@dxos/client';
import { PublicKeyLike } from '@dxos/keys';
import { log } from '@dxos/log';
import { useMulticastObservable } from '@dxos/react-async';

import { useClient } from '../client';
import { useIdentity } from '../halo';

/**
 * Get a specific Space using its key. Returns undefined when no spaceKey is
 * available. Requires a ClientProvider somewhere in the parent tree.
 * @returns a Space
 * @param [spaceKey] the key of the space to look for
 */
export const useSpace = (spaceKey?: PublicKeyLike) => {
  const spaces = useSpaces();
  return spaceKey ? spaces.find((space) => space.key.equals(spaceKey)) : undefined;
};

/**
 * Returns the first space in the current spaces array. If none exist, `undefined`
 * will be returned at first, then the hook will re-run and return a space once
 * it has been created. Requires a ClientProvider somewhere in the parent tree.
 * @returns a Space
 */
export const useOrCreateFirstSpace = () => {
  const client = useClient();
  const identity = useIdentity();
  const spaces = useSpaces({ all: true });
  const spacesReady = spaces.every((space) => space.state.get() === SpaceState.READY);
  const [space, setSpace] = useState(spaces?.[0]);
  const isCreatingSpace = useRef(false);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (identity && spacesReady && !space && !isCreatingSpace.current) {
        isCreatingSpace.current = true;
        try {
          const newSpace = await client.createSpace();
          setSpace(newSpace);
        } catch (err) {
          log.error('Failed to create space', err);
        } finally {
          isCreatingSpace.current = false;
        }
      }
    });

    return () => clearTimeout(timeout);
  }, [identity, spacesReady, space]);

  return spacesReady ? space : undefined;
};

export type UseSpacesParams = {
  /**
   * Return uninitialized spaces as well.
   */
  all?: boolean;
};

/**
 * Get all Spaces available to current user.
 * Requires a ClientProvider somewhere in the parent tree.
 * By default, only ready spaces are returned.
 * @returns an array of Spaces
 */
export const useSpaces = ({ all = false }: UseSpacesParams = {}): Space[] => {
  const client = useClient();
  const spaces = useMulticastObservable(client.spaces);

  // TODO(dmaretskyi): Array reference equality.
  return spaces.filter((space) => all || space.state.get() === SpaceState.READY);
};
