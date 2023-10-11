//
// Copyright 2023 DXOS.org
//

import React, { forwardRef, useMemo, useRef } from 'react';

import { Card } from '@dxos/aurora';
import { groupSurface, mx } from '@dxos/aurora-theme';

import {
  Mosaic,
  MosaicContainerProps,
  MosaicDataItem,
  MosaicTileComponent,
  Path,
  useSortedItems,
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
        onOver: ({ active, over }) => {
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
    const render = useRef(0);
    render.current++;

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
              <Card.Title title={title + ' #' + render.current} />
              <Card.Menu />
            </Card.Header>
          </Card.Root>

          <div className={mx('flex flex-col grow overflow-y-scroll')}>
            <div className='flex flex-col my-1'>
              <Mosaic.SortableContext id={path} items={sortedItems} direction='vertical'>
                {sortedItems.map((item, index) => (
                  <Mosaic.SortableTile
                    key={item.id}
                    item={item}
                    path={path}
                    position={index}
                    Component={Component!}
                    className='m-1'
                    // debug={debug}
                  />
                ))}
              </Mosaic.SortableContext>
            </div>
          </div>
          {debug && <Mosaic.Debug data={{ path, id, items: sortedItems.length, count: render.current }} />}
        </div>
      </div>
    );
  },
);
