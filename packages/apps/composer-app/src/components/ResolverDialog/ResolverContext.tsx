//
// Copyright 2023 DXOS.org
//

import React, { Context, createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { Document } from '@braneframe/types';
import { useTranslation } from '@dxos/aurora';
import { log } from '@dxos/log';
import { Loading } from '@dxos/react-appkit';
import { Space, useIdentity, useQuery, useSpaces, Text, observer } from '@dxos/react-client';
import { ShellProvider } from '@dxos/react-shell';

import { displayName, matchSpace } from '../../util';
import { DocumentResolverProps, SpaceResolverProps } from './ResolverProps';

const useLocationIdentifier = () => {
  const { '*': location } = useParams();
  let source, id;
  try {
    const url = location ? new URL(location) : undefined;
    source = url?.hostname.split('.').reverse().join('.');
    id = url?.pathname.slice(1);
  } catch (err) {
    log.catch(err);
  }
  return [source, id];
};

export const SpaceResolverContext: Context<SpaceResolverProps> = createContext<SpaceResolverProps>({
  space: null,
  setSpace: (_space) => {}
});

export const SpaceResolverProvider = observer(({ children }: PropsWithChildren<{}>) => {
  const [searchParams] = useSearchParams();
  const spaceInvitationCode = searchParams.get('spaceInvitationCode');
  const haloInvitationCode = searchParams.get('haloInvitationCode');
  const identity = useIdentity({ login: true });
  const identityHex = identity?.identityKey.toHex();
  const [source, id] = useLocationIdentifier();
  const spaces = useSpaces({ all: true });
  const { t } = useTranslation('appkit');

  const [nextSpace, setSpace] = useState<Space | null>(null);
  const [ready, setReady] = useState(false);

  const space = useMemo(
    () =>
      nextSpace ?? (identityHex ? spaces.find((space) => matchSpace(space, identityHex, source, id)) ?? null : null),
    [spaces, identityHex, source, id]
  );

  // [thure] This effect is intended to cause the context to wait a moment if at first no space is found, to avoid false
  // negatives due to replication time.
  useEffect(() => {
    !space && setTimeout(() => setReady(false), 0);
    setTimeout(() => setReady(true), !space ? 1e3 : 0);
  }, [identityHex, source, id]);

  return (
    <ShellProvider
      space={space || undefined}
      spaceInvitationCode={spaceInvitationCode}
      haloInvitationCode={haloInvitationCode}
      onJoinedSpace={(nextSpaceKey) => {
        console.warn('TODO: onJoinedSpace', nextSpaceKey);
      }}
    >
      {space || ready ? (
        <SpaceResolverContext.Provider value={{ space, setSpace, source, id, identityHex }}>
          {children}
        </SpaceResolverContext.Provider>
      ) : (
        <Loading label={t('generic loading label')} />
      )}
    </ShellProvider>
  );
});

const defaultDocumentResolverContext: DocumentResolverProps = {
  document: null,
  setDocument: (_document) => {}
};

export const DocumentResolverContext: Context<DocumentResolverProps> =
  createContext<DocumentResolverProps>(defaultDocumentResolverContext);

const DocumentsQueryableDocumentResolverProvider = ({
  space,
  source,
  id,
  children
}: PropsWithChildren<{ space: Space; source: string; id: string }>) => {
  const [document, setDocument] = useState<Document | null>(null);
  const defaultDisplayName = displayName(source, id);

  const documents = useQuery(space, (obj) => {
    const keys = obj.meta?.keys;
    return keys?.find((key: any) => key.source === source && key.id === id);
  });

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.source !== window.parent) {
        return;
      }

      if (event.data.type === 'initial-data') {
        const nextDocument = new Document({
          meta: {
            keys: [{ source, id }]
          },
          content: new Text(event.data.content),
          title: defaultDisplayName
        });
        space.db.add(nextDocument);
        setDocument(nextDocument);
      }
    };

    // todo(thure): Won't this always be the case initially?
    if (documents.length === 0) {
      window.addEventListener('message', handler);
      window.parent.postMessage({ type: 'request-initial-data' }, 'https://github.com');
      return () => window.removeEventListener('message', handler);
    } else {
      setDocument(documents[0] as Document);
    }
  }, [space, documents]);

  return (
    <DocumentResolverContext.Provider value={{ document, setDocument }}>{children}</DocumentResolverContext.Provider>
  );
};

export const DocumentResolverProvider = ({ children }: PropsWithChildren<{}>) => {
  const { space, source, id } = useContext(SpaceResolverContext);

  return space && source && id ? (
    <DocumentsQueryableDocumentResolverProvider space={space} source={source} id={id}>
      {children}
    </DocumentsQueryableDocumentResolverProvider>
  ) : (
    <DocumentResolverContext.Provider value={defaultDocumentResolverContext}>
      {children}
    </DocumentResolverContext.Provider>
  );
};
