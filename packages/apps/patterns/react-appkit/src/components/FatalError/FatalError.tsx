//
// Copyright 2022 DXOS.org
//

import { Clipboard } from 'phosphor-react';
import React, { useCallback } from 'react';

import { Alert, Button, Dialog, Tooltip, useTranslation } from '@dxos/react-components';

// TODO(burdon): Factor out.
const parseError = (error: Error) => {
  const message = String(error); // Error.name + Error.message

  let stack = String(error?.stack);
  if (stack.indexOf(message) === 0) {
    stack = stack.substr(message.length).trim();
  }

  // Removes indents.
  stack = stack
    .split('\n')
    .map((text) => text.trim())
    .join('\n');

  return { message, stack };
};

export interface FatalErrorProps {
  error: Error;
}

export const FatalError = ({ error }: FatalErrorProps) => {
  const { t } = useTranslation('appkit');
  // TODO(wittjosiah): process.env.NODE_ENV not available. Make a prop and determine from config?
  const isDev = process.env.NODE_ENV === 'development';

  const { message, stack } = parseError(error);
  const onCopyError = useCallback(() => {
    void navigator.clipboard.writeText(JSON.stringify({ message, stack }));
  }, [message, stack]);

  // TODO(burdon): Make responsive (full page mobile).
  return (
    <Dialog
      title={t('fatal error label')}
      slots={{ overlay: { className: 'md:w-[500px' }, content: { className: 'w-full]' } }}
      initiallyOpen
    >
      {isDev ? (
        <Alert title={message} valence={'error'} slots={{ root: { className: 'mlb-4' } }}>
          <pre className='text-xs overflow-auto max-w-72 max-h-72 overflow-hidden'>{stack}</pre>
        </Alert>
      ) : (
        <p>{t('fatal error message')}</p>
      )}
      <div role='none' className='flex'>
        <Tooltip content={t('copy error label')} zIndex={'z-[21]'}>
          <Button onClick={onCopyError}>
            <Clipboard weight='duotone' size='1em' />
          </Button>
        </Tooltip>
        <div role='none' className='flex-grow' />
        {/* TODO(wittjosiah): How do we get access to Client here so that we can trigger reset? */}
        {/* <Button variant='primary' onClick={() => client.reset()}>
          {t('reset client label')}
        </Button> */}
        <Button variant='primary' onClick={() => location.reload()}>
          {t('reload page label')}
        </Button>
      </div>
    </Dialog>
  );
};
