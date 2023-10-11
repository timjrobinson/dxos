//
// Copyright 2023 DXOS.org
//

import React, { forwardRef, useMemo } from 'react';

import { Card } from '@dxos/aurora';
import { groupSurface, mx } from '@dxos/aurora-theme';

import {
  MosaicContainerProps,
  Mosaic,
  MosaicDataItem,
  Path,
  useSortedItems,
  MosaicTileComponent,
  useContainer,
} from '../../mosaic';

// Example:
// https://master--5fc05e08a4a65d0021ae0bf2.chromatic.com/?path=/story/presets-sortable-multiple-containers--basic-setup

export type KanbanColumn<TData extends MosaicDataItem = MosaicDataItem> = MosaicDataItem & {
  title: string;
  children: TData[];
};

export type KanbanProps<TData extends MosaicDataItem = MosaicDataItem> = MosaicContainerProps<TData, number> & {
  columns: KanbanColumn<TData>[];
  debug?: boolean;
};

export const Kanban = ({
  id,
  columns,
  Component: TileComponent = Mosaic.DefaultComponent,
  debug,
  onDrop,
}: KanbanProps) => {
  const Component = useMemo(() => OverlayComponent(id, TileComponent), [id, TileComponent]);

  return (
    <Mosaic.Container
      {...{
        id,
        debug,
        Component,
        // Restrict columns to x-axis.
        modifier: ({ path, item }, { transform }) =>
          path === Path.create(id, item.id) ? { ...transform, y: 0 } : transform,
        isDroppable: ({ active, over }) => {
          return Path.length(active.path) >= Path.length(over.path);
        },
        onDrop,
      }}
    >
      <div className='grow flex overflow-y-hidden overflow-x-auto'>
        <div className='flex'>
          <Mosaic.SortableContext items={columns} direction='horizontal'>
            {columns.map((column, index) => (
              <Mosaic.SortableTile
                key={column.id}
                item={column}
                path={id}
                position={index}
                Component={Component}
                debug={debug}
              />
            ))}
          </Mosaic.SortableContext>
        </div>
      </div>
    </Mosaic.Container>
  );
};

const OverlayComponent = (id: string, Component: MosaicTileComponent<any>): MosaicTileComponent<any> =>
  forwardRef((props, ref) => {
    const isColumn = Path.hasRoot(props.path, id) && Path.length(props.path) === 2;
    if (isColumn && props.isActive) {
      return (
        // Needs to not override the main kanban path.
        <Mosaic.Container {...{ id: `${id}-active`, Component }}>
          <KanbanColumnComponent {...props} ref={ref} />
        </Mosaic.Container>
      );
    }

    return isColumn ? <KanbanColumnComponent {...props} ref={ref} /> : <Component {...props} ref={ref} />;
  });

const KanbanColumnComponent: MosaicTileComponent<KanbanColumn> = forwardRef(
  ({ path, item, isDragging, draggableStyle, draggableProps, debug }, forwardRef) => {
    const { id, title, children } = item;
    const { Component } = useContainer();
    const sortedItems = useSortedItems({ path, items: children });

    return (
      <div role='none' className='grow flex flex-col' ref={forwardRef}>
        <div
          className={mx(
            groupSurface,
            'grow flex flex-col w-[300px] snap-center overflow-hidden m-1',
            isDragging && 'opacity-0',
          )}
          style={draggableStyle}
        >
          <Card.Root classNames='shrink-0 bg-cyan-200'>
            <Card.Header>
              <Card.DragHandle {...draggableProps} />
              <Card.Title title={title} />
              <Card.Menu />
            </Card.Header>
          </Card.Root>

          <div className={mx('flex flex-col grow overflow-y-scroll')}>
            <div className='flex flex-col'>
              <Mosaic.SortableContext id={path} items={sortedItems} direction='vertical'>
                {sortedItems.map((item, i) => (
                  <Mosaic.SortableTile key={item.id} item={item} path={path} position={i} Component={Component!} />
                ))}
              </Mosaic.SortableContext>
            </div>
          </div>
          {debug && <Mosaic.Debug data={{ path, id, items: sortedItems.length }} />}
        </div>
      </div>
    );
  },
);
