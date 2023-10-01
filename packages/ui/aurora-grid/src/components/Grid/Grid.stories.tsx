//
// Copyright 2023 DXOS.org
//

import '@dxosTheme';

import { faker } from '@faker-js/faker';
import React, { useState } from 'react';

import { Grid, GridLayout } from './Grid';
import { MosaicContextProvider, MosaicDataItem, MosaicMoveEvent } from '../../dnd';
import { createItem, FullscreenDecorator, ComplexCard } from '../../testing';

faker.seed(99);

const size = { x: 8, y: 8 };
const testItems = Array.from({ length: 8 }).map(() => createItem(['document', 'image']));
const testLayout = testItems.reduce<GridLayout>((map, item) => {
  map[item.id] = { x: faker.number.int({ min: 0, max: size.x - 1 }), y: faker.number.int({ min: 0, max: size.y - 1 }) };
  return map;
}, {});

export default {
  component: Grid.Root,
  decorators: [FullscreenDecorator()],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = () => {
  const [items] = useState<MosaicDataItem[]>(testItems);
  const [layout, setLayout] = useState<GridLayout>(testLayout);
  const handleMoveItem = ({ active, over }: MosaicMoveEvent) => {
    setLayout((layout) => ({ ...layout, [active.item.id]: over.position }));
  };

  return (
    <MosaicContextProvider debug>
      <Grid.Root
        id='test'
        items={items}
        layout={layout}
        size={size}
        debug
        Component={ComplexCard}
        onMoveItem={handleMoveItem}
      />
    </MosaicContextProvider>
  );
};
