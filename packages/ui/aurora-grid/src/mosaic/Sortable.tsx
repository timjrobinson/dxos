//
// Copyright 2023 DXOS.org
//

import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import React, { PropsWithChildren } from 'react';

import { useContainer } from './hooks';
import { MosaicDataItem } from './types';

type Direction = 'horizontal' | 'vertical';

export type MosaicSortableProps<TData extends MosaicDataItem = MosaicDataItem> = PropsWithChildren<{
  id?: string;
  items?: TData[];
  direction?: Direction;
}>;

/**
 * Mosaic convenience wrapper for DndKit SortableContext.
 */
export const MosaicSortable = ({ id, items = [], direction = 'vertical', children }: MosaicSortableProps) => {
  const container = useContainer();
  const contextId = id ?? container.id;
  const Direction = direction === 'vertical' ? Column : Row;

  return (
    <Direction id={contextId} items={items.map((item) => `${contextId}/${item.id}`)}>
      {children}
    </Direction>
  );
};

const Column = ({ children, id, items }: PropsWithChildren<{ id: string; items: string[] }>) => (
  <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
    {children}
  </SortableContext>
);

const Row = ({ children, id, items }: PropsWithChildren<{ id: string; items: string[] }>) => (
  <SortableContext id={id} items={items} strategy={horizontalListSortingStrategy}>
    {children}
  </SortableContext>
);
