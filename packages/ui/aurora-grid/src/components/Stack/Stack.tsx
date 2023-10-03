//
// Copyright 2023 DXOS.org
//

import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { FC, PropsWithChildren } from 'react';

import { mx } from '@dxos/aurora-theme';

import {
  DefaultComponent,
  MosaicContainer,
  MosaicContainerProps,
  MosaicDataItem,
  MosaicDraggedItem,
  useContainer,
} from '../../dnd';

type StackRootProps<TData extends MosaicDataItem> = MosaicContainerProps<TData, number> & {
  items?: TData[];
  direction?: Direction;
};

export type Direction = 'horizontal' | 'vertical';

// TODO(burdon): Make generic (and forwardRef).
const StackRoot = ({
  id,
  items = [],
  Component = DefaultComponent,
  onMoveItem,
  children,
  direction = 'vertical',
}: PropsWithChildren<StackRootProps<any>>) => {
  const strategy = direction === 'vertical' ? verticalListSortingStrategy : horizontalListSortingStrategy;
  return (
    <MosaicContainer container={{ id, Component, isDroppable: () => true, onMoveItem }}>
      <SortableContext id={id} items={items} strategy={strategy}>
        {children}
      </SortableContext>
    </MosaicContainer>
  );
};

const StackTile: FC<{
  item: MosaicDataItem;
  index: number;
  debug?: boolean;
  onSelect?: () => void;
}> = ({ item, index, debug, onSelect }) => {
  const { id: container, Component = DefaultComponent } = useContainer();
  const { setNodeRef, attributes, listeners, transform, isDragging } = useSortable({
    id: item.id,
    data: { container, item, position: index } satisfies MosaicDraggedItem,
  });

  return (
    <Component
      ref={setNodeRef}
      data={item}
      container={container}
      isDragging={isDragging}
      draggableStyle={{
        transform: transform ? CSS.Transform.toString(Object.assign(transform, { scaleY: 1 })) : undefined,
      }}
      draggableProps={{ ...attributes, ...listeners }}
      className={mx(isDragging && 'opacity-30')}
      onSelect={onSelect}
      debug={debug}
    />
  );
};

export const Stack = {
  Root: StackRoot,
  Tile: StackTile,
};

export type { StackRootProps };
