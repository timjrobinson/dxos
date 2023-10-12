//
// Copyright 2023 DXOS.org
//

import React, { forwardRef } from 'react';

import { Card, Tree as TreeComponent, TreeItem as TreeItemComponent } from '@dxos/aurora';
import { dropRing, mx } from '@dxos/aurora-theme';

import {
  MosaicContainerProps,
  Mosaic,
  MosaicDataItem,
  MosaicTileComponent,
  useContainer,
  useMosaic,
  Path,
} from '../../mosaic';

// TODO(burdon): Tree data model that provides a pure abstraction of the plugin Graph.
// - The Tree (like Stack, Grid) is a high level container that assembles Radix style Aurora components from a model.
// - Models in general should be easily mapped from the Graph and/or ECHO queries.
// - See: https://master--5fc05e08a4a65d0021ae0bf2.chromatic.com/?path=/story/examples-tree-sortable--basic-setup

export type TreeProps<TData extends MosaicDataItem = TreeData> = MosaicContainerProps<TData, number> & {
  items?: TData[];
  debug?: boolean;
};

export type TreeData = {
  id: string;
  label?: string; // TODO(burdon): Provide adapter.
  children: TreeData[];
};

// TODO(burdon): Make generic (and forwardRef).
export const Tree = ({ id, Component = TreeItem, onOver, onDrop, items = [], debug }: TreeProps) => {
  return (
    <TreeComponent.Root classNames='flex flex-col'>
      <Mosaic.Container
        {...{
          id,
          debug,
          Component,
          onOver,
          onDrop,
        }}
      >
        <Mosaic.SortableContext id={id} items={items} direction='vertical'>
          {items.map((item, index) => (
            <TreeItemComponent.Root key={item.id} collapsible defaultOpen>
              <Mosaic.SortableTile item={item} path={id} position={index} Component={Component} debug={debug} />
            </TreeItemComponent.Root>
          ))}
        </Mosaic.SortableContext>
      </Mosaic.Container>
    </TreeComponent.Root>
  );
};

/**
 * Pure component that is used by the mosaic overlay.
 */
const TreeItem: MosaicTileComponent<TreeData> = forwardRef(
  ({ path, draggableStyle, draggableProps, item, isActive, isOver, isDragging, className }, forwardedRef) => {
    return (
      <div
        ref={forwardedRef}
        style={draggableStyle}
        className={mx('flex flex-col rounded', className, isDragging && 'opacity-0', isOver && dropRing)}
      >
        <Card.Header>
          <Card.DragHandle {...draggableProps} />
          <Card.Title title={item.label ?? path} classNames='truncate' />
        </Card.Header>

        {!isActive && !isDragging && item.children && <TreeBranch path={path} items={item.children} />}
      </div>
    );
  },
);

const TreeBranch = ({ path, items }: { path: string; items: TreeData[] }) => {
  const { overItem } = useMosaic();
  const { Component } = useContainer();

  return (
    <TreeItemComponent.Body className='pis-4'>
      <Mosaic.SortableContext id={path} items={items} direction='vertical'>
        {items.map((child, index) => (
          <TreeComponent.Branch key={child.id}>
            <TreeItemComponent.Root collapsible defaultOpen>
              <Mosaic.SortableTile
                item={child}
                path={path}
                position={index}
                Component={Component!}
                isOver={overItem?.path === Path.create(path, child.id)}
              />
            </TreeItemComponent.Root>
          </TreeComponent.Branch>
        ))}
      </Mosaic.SortableContext>
    </TreeItemComponent.Body>
  );
};
