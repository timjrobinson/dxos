//
// Copyright 2023 DXOS.org
//

import 'github-markdown-css/github-markdown.css';
import DOMPurify from 'dompurify';
import React, { useEffect, useState } from 'react';

import { Button, useTranslation } from '@dxos/aurora';
import { Loading } from '@dxos/react-appkit';

import { useOctokitContext, PatDialog } from '../../components';

const defaultOptions: Parameters<typeof DOMPurify.sanitize>[1] = {
  ALLOWED_TAGS: [
    'span',
    'div',
    'b',
    'i',
    'em',
    'strong',
    'a',
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'table',
    'td',
    'th',
    'tr',
    'blockquote',
    'ul',
    'ol',
    'li',
    'dd',
    'tt',
    'dl',
    'dt',
    'details',
    'figcaption',
    'figure',
    'summary',
    'abbr',
    'dfn',
    'mark',
    'sub',
    'sup',
    'img',
    'code',
    'kbd',
    'pre',
    'samp',
    'hr',
    'input',
    'pre',
    'del',
    'g-emoji',
    'label',
  ],
  ALLOWED_ATTR: ['class', 'href', 'target', 'hidden', 'title', 'type', 'role', 'align', 'data-footnote-ref'],
};

const sanitize = (dirty: string, options: Partial<Parameters<typeof DOMPurify.sanitize>[1]>) => ({
  __html: DOMPurify.sanitize(dirty, { ...defaultOptions, ...options }) as string,
});

export type GfmPreviewProps = {
  markdown: string;
  owner?: string;
  repo?: string;
};

export const GfmPreview = ({ markdown, owner, repo }: GfmPreviewProps) => {
  const [html, setHtml] = useState('');
  const { octokit } = useOctokitContext();
  const { t } = useTranslation('composer');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (octokit && markdown) {
      void octokit
        .request('POST /markdown', {
          text: markdown,
          ...(owner && repo && { context: `${owner}/${repo}` }),
        })
        .then(
          ({ data }) => setHtml(data),
          () => {},
        );
    }
  }, [markdown, octokit]);

  return html ? (
    <>
      <style>{'.markdown-body ol, .markdown-body ul {list-style-type: disc; list-style-position: outside;}'}</style>
      <article
        className='markdown-body grow max-is-[980px] mli-auto p-[15px] sm:pli-[45px] sm:plb-[30px]'
        dangerouslySetInnerHTML={sanitize(html, {})}
      />
    </>
  ) : (
    <div role='none' className='mli-auto max-bs-[300px] text-center'>
      <PatDialog open={dialogOpen} setOpen={setDialogOpen} />
      {!octokit && <p className='mlb-4'>{t('empty github pat message')}</p>}
      {octokit ? (
        <Loading label={t('loading preview message')} />
      ) : (
        <Button onClick={() => setDialogOpen(true)}>{t('set github pat label')}</Button>
      )}
    </div>
  );
};
