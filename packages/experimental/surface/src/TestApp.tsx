//
// Copyright 2023 DXOS.org
//

import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import React, { useEffect } from 'react';
import { createMemoryRouter, Outlet, RouterProvider, useNavigate } from 'react-router-dom';

import { Button } from '@dxos/aurora';
import { Generator } from '@dxos/kai-types/testing';
import { PublicKey, useSpace, useSpaces } from '@dxos/react-client';

import { AppContextProvider, RouteAdapter, Surface, useActionDispatch } from './framework';
import { DebugPlugin, SpacesPlugin, StackPlugin } from './plugins';

// Issues:
// - TODO(burdon): App and Plugin lifecycle.
// - TODO(burdon): State management (access indexed app state). How does a plugin get state?
// - TODO(burdon): Map route to Surfaces and Surface to plugin.
// - TODO(burdon): Actions dispatch (bubbling). Contracts/type-safety.
// - TODO(burdon): Stack plugin: contract to section components from plugins.

/**
 * Goals
 * - Don't use React router navigate directly.
 * - Update app state from router.
 * - Update surfaces bases on app state.
 */

export type AppState = {
  // TODO(burdon): Map to actual objects (create test space/objects)?
  // space: Space;
  // object?: TypedObject;

  spaceKey?: PublicKey;
  objectId?: string;
  counter?: number;
};

export const TestApp = () => {
  // Use natural routes to configure surfaces
  const router = createMemoryRouter([
    {
      path: '/',
      element: <AppRoot />,
      children: [
        {
          path: '/',
          element: <Surface plugin='org.dxos.spaces' component='main' />
        },
        {
          path: '/:spaceKey',
          element: <SpaceContainer />,
          // TODO(burdon): Use to async load Space? Doesn't seem to work in storybook?
          // https://reactrouter.com/en/main/route/loader
          // loader: ({ params: { spaceKey } }) => {
          //   return { spaceKey: spaceKey ? PublicKey.from(spaceKey) : undefined };
          // }
          children: [
            {
              path: '/:spaceKey/:objectId'
            }
          ]
        }
      ]
    }
  ]);

  // TODO(burdon): Create NavPlugin for app.

  const routeAdapter: RouteAdapter<AppState> = {
    paramsToState: ({ spaceKey, objectId }: { spaceKey?: string; objectId?: string }): AppState => {
      return {
        spaceKey: spaceKey ? PublicKey.from(spaceKey) : undefined,
        objectId
      };
    },

    stateToPath: ({ spaceKey, objectId }: AppState = {}): string => {
      return '/' + [spaceKey?.toHex(), objectId].filter(Boolean).join('/');
    }
  };

  return (
    <AppContextProvider
      // prettier-ignore
      plugins={[
        new DebugPlugin(),
        new SpacesPlugin(),
        new StackPlugin()
      ]}
    >
      <RouterProvider router={router} fallbackElement={<div>FALLBACK</div>} />
    </AppContextProvider>
  );
};

//
// Components
//

// TODO(burdon): See AppContainer (Sidebar, etc.)
export const AppRoot = () => {
  const spaces = useSpaces();
  useEffect(() => {
    const generator = new Generator(spaces[0].db);
    void generator.generate();
  }, [spaces]);

  return (
    <div className='flex flex-col grow overflow-hidden'>
      <div className='flex shrink-0 p-4 bg-zinc-200'>
        <Header />
      </div>

      <main className='flex flex-col grow p-4'>
        <Outlet />
      </main>

      <div className='flex shrink-0 p-4 bg-zinc-200'>
        <Surface plugin='org.dxos.debug' component='main' />
      </div>
    </div>
  );
};

export const Header = () => {
  const navigate = useNavigate();
  const appNavigate = useAppNavigate<AppState>();
  // TODO(burdon): Create plugin to handle space selection.
  const dispatch = useActionDispatch();
  const spaces = useSpaces();
  const space = spaces[0];

  return (
    <nav className='flex grow justify-between'>
      {/* Action. */}
      <div className='flex space-x-2'>
        <Button onClick={() => appNavigate()}>Home</Button>
        <Button onClick={() => appNavigate({ spaceKey: space.key })}>Space</Button>
        {/* TODO(burdon): Select object. */}
        <Button onClick={() => appNavigate({ spaceKey: space.key, objectId: '123' })}>Object</Button>
      </div>

      {/* Direct navigation. */}
      <div className='flex space-x-2'>
        <Button onClick={() => dispatch({ type: 'inc' })}>Inc</Button>
        <Button onClick={() => navigate('/settings')}>Settings</Button>
        <Button onClick={() => navigate(-1)}>
          <CaretLeft />
        </Button>
        <Button onClick={() => navigate(1)}>
          <CaretRight />
        </Button>
      </div>
    </nav>
  );
};

export const SpaceContainer = () => {
  const { spaceKey, objectId } = useAppState();
  const space = useSpace(spaceKey);
  const object = space?.db.getObjectById(objectId);

  return (
    <div>
      <div>
        <h2>SpaceContainer</h2>
        {spaceKey && (
          <div>
            <span>space key</span>
            <pre>{spaceKey.truncate()}</pre>
          </div>
        )}
        {objectId && (
          <div>
            <span>object id</span>
            <pre>{objectId}</pre>
          </div>
        )}
      </div>

      {object && <Surface plugin='org.dxos.stack' data={{ object }} />}
    </div>
  );
};
