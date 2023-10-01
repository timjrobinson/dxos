//
// Copyright 2023 DXOS.org
//

import '@dxosTheme';

import { faker } from '@faker-js/faker';
import React, { useState } from 'react';

import { Card } from '@dxos/aurora';

import { Kanban, KanbanColumn } from './Kanban';
import { MosaicContextProvider, MosaicMoveEvent } from '../../dnd';
import { createItem, FullscreenDecorator } from '../../testing';

faker.seed(3);

export default {
  component: Card,
  decorators: [FullscreenDecorator()],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>(() => {
    return Array.from({ length: 3 }).map((_, i) => ({
      id: `stack-column-${i}`,
      title: `Column ${i}`,
      items: Array.from({ length: 5 - i }).map(() => createItem(['document', 'image'])),
    }));
  });

  // const handleDelete = (id: string) => {
  //   setItems1((cards) => cards.filter((card) => card.id !== id));
  // };

  const handleMoveItem = ({ container, active, over }: MosaicMoveEvent<number>) => {
    setColumns((columns) =>
      columns.map((column) => {
        const items = [...column.items];
        if (active.container === column.id && column.id === container) {
          items.splice(active.position!, 1);
        }
        if (over.container === column.id && column.id === container) {
          items.splice(over.position!, 0, active.item);
        }
        return { ...column, items };
      }),
    );
  };

  return (
    <MosaicContextProvider debug>
      <Kanban.Root id='kanban' columns={columns} onMoveItem={handleMoveItem} />
    </MosaicContextProvider>
  );
};
