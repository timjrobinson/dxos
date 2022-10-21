//
// Copyright 2022 DXOS.org
//

import yaml from 'js-yaml';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { v4 as uuid, validate as validateUuid } from 'uuid';

import { captureException } from '@dxos/sentry';

export const getTelemetryApiKey = () => {
  switch (process.env.DX_ENVIRONMENT) {
    default:
      return 'B00QG6PtJJrJ0VVFe0H5a6bcUUShKyZM';
  }
};

export type TelemetryContext = {
  machineId: string
  identityId: string
  fullCrashReports: boolean
  disableTelemetry: boolean
}

const DEFAULTS = {
  // TODO(wittjosiah): Create second identifier per HALO identity.
  identityId: 'default',
  fullCrashReports: false,
  disableTelemetry: false
};

export const getTelemetryContext = async (configDir: string): Promise<TelemetryContext> => {
  const configDirExists = await exists(configDir);
  if (!configDirExists) {
    await mkdir(configDir, { recursive: true });
  }

  const idPath = join(configDir, 'telemetry.yml');
  if (await exists(idPath)) {
    const context = await readFile(idPath, 'utf-8');
    return validate(context) ?? createContext(idPath);
  }

  return createContext(idPath);
};

const createContext = async (idPath: string) => {
  const machineId = uuid();
  const context = yaml.dump({ machineId });
  const comment = '# This file is automatically generated by the dx-cli.\n';
  await writeFile(idPath, `${comment}${context}`, 'utf-8');
  return { ...DEFAULTS, machineId };
};

const validate = (contextString: string) => {
  try {
    const context = yaml.load(contextString) as TelemetryContext;
    if (Boolean(context.machineId) && validateUuid(context.machineId)) {
      return { ...DEFAULTS, ...context };
    }
  } catch (err: any) {
    captureException(err);
  }
};

// TODO(wittjosiah): Factor out.
const exists = async (filePath: string): Promise<boolean> => {
  try {
    const result = await stat(filePath);
    return !!result;
  } catch (err: any) {
    if (/ENOENT/.test(err.message)) {
      return false;
    } else {
      throw err;
    }
  }
};
