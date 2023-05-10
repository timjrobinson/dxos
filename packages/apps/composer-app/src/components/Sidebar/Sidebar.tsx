//
// Copyright 2023 DXOS.org
//

import { ArrowLineLeft, GearSix, Intersect, Planet, Sidebar } from '@phosphor-icons/react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Document } from '@braneframe/types';
import {
  Button,
  DensityProvider,
  ElevationProvider,
  ThemeContext,
  useId,
  useThemeContext,
  useTranslation,
  useSidebar
} from '@dxos/aurora';
import { getSize, mx, osTx } from '@dxos/aurora-theme';
import { Tooltip, Avatar, Dialog, Input, TreeRoot } from '@dxos/react-appkit';
import { observer, ShellLayout, useClient, useIdentity, useSpaces } from '@dxos/react-client';
import { useShell } from '@dxos/react-shell';

import { getPath } from '../../router';
import { useOctokitContext } from '../OctokitProvider';
import { Separator } from '../Separator';
import { HiddenSpacesTree } from './HiddenSpacesTree';
import { SpaceTreeItem } from './SpaceTreeItem';

const DocumentTree = observer(() => {
  // TODO(wittjosiah): Fetch all spaces and render pending spaces differently.
  const spaces = useSpaces({ all: true });
  const treeLabel = useId('treeLabel');
  const { t } = useTranslation('composer');
  const identity = useIdentity();
  return (
    <div className='grow flex flex-col plb-1.5 pis-1 pie-1.5 min-bs-0 overflow-y-auto'>
      <span className='sr-only' id={treeLabel}>
        {t('sidebar tree label')}
      </span>
      <TreeRoot aria-labelledby={treeLabel} data-testid='composer.sidebarTree' className='shrink-0'>
        {spaces
          .filter((space) => !identity || space.properties.members?.[identity.identityKey.toHex()]?.hidden !== true)
          .map((space) => {
            return <SpaceTreeItem key={space.key.toHex()} space={space} />;
          })}
      </TreeRoot>
      <div role='none' className='grow' />
      <HiddenSpacesTree
        hiddenSpaces={spaces.filter(
          (space) => !identity || space.properties.members?.[identity.identityKey.toHex()]?.hidden === true
        )}
      />
    </div>
  );
});

const SIDEBAR_CONTENT_NAME = 'SidebarContent';

const SidebarContent = () => {
  const client = useClient();
  const shell = useShell();
  const navigate = useNavigate();
  const { t } = useTranslation('composer');
  const { closeSidebar } = useSidebar(SIDEBAR_CONTENT_NAME);
  const identity = useIdentity();
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const { pat, setPat } = useOctokitContext();
  const [patValue, setPatValue] = useState(pat);
  const themeContext = useThemeContext();

  useEffect(() => {
    setPatValue(pat);
  }, [pat]);

  const handleCreateSpace = async () => {
    const space = await client.createSpace();
    const document = await space.db.add(new Document());
    return navigate(getPath(space.key, document.id));
  };

  const handleJoinSpace = () => {
    void shell.setLayout(ShellLayout.JOIN_SPACE);
  };

  return (
    <ThemeContext.Provider value={{ ...themeContext, tx: osTx }}>
      <ElevationProvider elevation='chrome'>
        <DensityProvider density='fine'>
          <Dialog
            title={t('profile settings label')}
            open={settingsDialogOpen}
            onOpenChange={(nextOpen) => {
              setSettingsDialogOpen(nextOpen);
              if (!nextOpen) {
                void setPat(patValue);
              }
            }}
            slots={{ overlay: { className: 'z-40 backdrop-blur' } }}
            closeTriggers={[
              <Button key='a1' variant='primary' data-testid='composer.closeUserSettingsDialog'>
                {t('done label', { ns: 'os' })}
              </Button>
            ]}
          >
            <Input
              label={t('github pat label')}
              value={patValue}
              data-testid='composer.githubPat'
              onChange={({ target: { value } }) => setPatValue(value)}
              slots={{
                root: { className: 'mlb-2' },
                input: { autoFocus: true, spellCheck: false, className: 'font-mono' }
              }}
            />
          </Dialog>
          <div role='none' className='flex flex-col bs-full'>
            <div role='none' className='shrink-0 flex items-center pli-1.5 plb-1.5'>
              <h1 className={mx('grow font-system-medium text-lg pli-1.5')}>{t('current app name')}</h1>
              <Tooltip
                content={t('create space label', { ns: 'appkit' })}
                zIndex='z-[31]'
                side='bottom'
                tooltipLabelsTrigger
              >
                <Button
                  variant='ghost'
                  data-testid='composer.createSpace'
                  onClick={handleCreateSpace}
                  className='pli-1'
                >
                  <Planet className={getSize(4)} />
                </Button>
              </Tooltip>
              <Tooltip
                content={t('join space label', { ns: 'appkit' })}
                zIndex='z-[31]'
                side='bottom'
                tooltipLabelsTrigger
              >
                <Button variant='ghost' data-testid='composer.joinSpace' onClick={handleJoinSpace} className='pli-1'>
                  <Intersect className={getSize(4)} />
                </Button>
              </Tooltip>
              <Tooltip
                content={t('close sidebar label', { ns: 'os' })}
                zIndex='z-[31]'
                side='bottom'
                tooltipLabelsTrigger
              >
                <Button
                  variant='ghost'
                  data-testid='composer.toggleSidebarWithinSidebar'
                  onClick={closeSidebar}
                  className='pli-1'
                >
                  <ArrowLineLeft className={getSize(4)} />
                </Button>
              </Tooltip>
            </div>
            <Separator flush />
            <DocumentTree />
            <Separator flush />
            {identity && (
              <div role='none' className='shrink-0 flex items-center gap-1 pli-3 plb-1.5'>
                <Avatar
                  size={6}
                  variant='circle'
                  fallbackValue={identity.identityKey.toHex()}
                  status='active'
                  label={
                    <p className='grow text-sm'>{identity.profile?.displayName ?? identity.identityKey.truncate()}</p>
                  }
                />
                <Tooltip content={t('profile settings label')} zIndex='z-[31]' side='bottom' tooltipLabelsTrigger>
                  <Button
                    variant='ghost'
                    data-testid='composer.openUserSettingsDialog'
                    onClick={() => setSettingsDialogOpen(true)}
                    className='pli-1'
                  >
                    <GearSix className={mx(getSize(4), 'rotate-90')} />
                  </Button>
                </Tooltip>
              </div>
            )}
          </div>
        </DensityProvider>
      </ElevationProvider>
    </ThemeContext.Provider>
  );
};

SidebarContent.displayName = SIDEBAR_CONTENT_NAME;

const SIDEBAR_TOGGLE_NAME = 'SidebarToggle';

const SidebarToggle = () => {
  const { openSidebar, sidebarOpen } = useSidebar(SIDEBAR_TOGGLE_NAME);
  const { t } = useTranslation('os');
  const themeContext = useThemeContext();
  const button = (
    <Button data-testid='composer.toggleSidebar' onClick={openSidebar} className='p-0 is-[40px]'>
      <Sidebar weight='light' className={getSize(6)} />
    </Button>
  );
  return (
    <ThemeContext.Provider value={{ ...themeContext, tx: osTx }}>
      <div
        role='none'
        className={mx(
          'fixed block-start-0 pointer-coarse:block-end-0 pointer-coarse:block-start-auto p-2 transition-[inset-inline-start,opacity] ease-in-out duration-200 inline-start-0',
          sidebarOpen && 'opacity-0 pointer-events-none'
        )}
      >
        {sidebarOpen ? (
          button
        ) : (
          <Tooltip content={t('open sidebar label')} tooltipLabelsTrigger side='right'>
            {button}
          </Tooltip>
        )}
      </div>
    </ThemeContext.Provider>
  );
};

SidebarToggle.displayName = SIDEBAR_TOGGLE_NAME;

export { SidebarContent, SidebarToggle };
