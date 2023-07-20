//
// Copyright 2023 DXOS.org
//

import { Article, ArticleMedium, Trash } from '@phosphor-icons/react';
import get from 'lodash.get';
import React from 'react';

import { GraphNode } from '@braneframe/plugin-graph';
import { Document } from '@braneframe/types';
import { ComposerModel, TextKind, YText } from '@dxos/aurora-composer';
import { EchoObject, Space } from '@dxos/client';
import { Plugin } from '@dxos/react-surface';

import { MarkdownProperties, MarkdownProvides } from './types';

export const MARKDOWN_PLUGIN = 'dxos:markdown';

export const isMarkdown = (datum: unknown): datum is ComposerModel =>
  datum && typeof datum === 'object'
    ? 'id' in datum &&
      typeof datum.id === 'string' &&
      (typeof (datum as { [key: string]: any }).content === 'string' ||
        (datum as { [key: string]: any }).content instanceof YText)
    : false;

export const isMarkdownContent = (datum: unknown): datum is { content: ComposerModel } =>
  !!datum &&
  typeof datum === 'object' &&
  (datum as { [key: string]: any }).content &&
  isMarkdown((datum as { [key: string]: any }).content);

export const isMarkdownPlaceholder = (datum: unknown): datum is ComposerModel =>
  datum && typeof datum === 'object'
    ? 'id' in datum && typeof datum.id === 'string' && 'content' in datum && typeof datum.content === 'function'
    : false;

export const isMarkdownProperties = (datum: unknown): datum is MarkdownProperties =>
  datum instanceof EchoObject
    ? true
    : datum && typeof datum === 'object'
    ? 'title' in datum && typeof datum.title === 'string'
    : false;

type MarkdownPlugin = Plugin<MarkdownProvides>;
export const markdownPlugins = (plugins: Plugin[]): MarkdownPlugin[] => {
  return (plugins as MarkdownPlugin[]).filter((p) => Boolean(p.provides?.markdown));
};

export const documentToGraphNode = (document: Document, parent: GraphNode<Space>, index: string): GraphNode => ({
  id: document.id,
  index: get(document, 'meta.index', index),
  label: document.title ?? 'New Document', // TODO(burdon): Translation.
  icon: (props) => (document.content?.kind === TextKind.PLAIN ? <ArticleMedium {...props} /> : <Article {...props} />),
  data: document,
  parent,
  pluginActions: {
    [MARKDOWN_PLUGIN]: [
      {
        id: 'delete',
        index: 'a1',
        label: ['delete document label', { ns: MARKDOWN_PLUGIN }],
        icon: (props) => <Trash {...props} />,
        invoke: async () => {
          parent.data?.db.remove(document);
        },
      },
    ],
  },
});
