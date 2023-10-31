//
// Copyright 2022 DXOS.org
//

import defaultsDeep from 'lodash.defaultsdeep';

import { type LogConfig, type LogFilter, LogLevel, type LogOptions, LogProcessorType, levels } from './config';
import { type LogProcessor } from './context';
import { loadOptions } from './platform';
import { CONSOLE_PROCESSOR, DEBUG_PROCESSOR, BROWSER_PROCESSOR } from './processors';

/**
 * Processor variants.
 */
export const processors: { [index: string]: LogProcessor } = {
  [LogProcessorType.CONSOLE]: CONSOLE_PROCESSOR,
  [LogProcessorType.BROWSER]: BROWSER_PROCESSOR,
  [LogProcessorType.DEBUG]: DEBUG_PROCESSOR,
};

const IS_BROWSER = typeof window !== 'undefined' || typeof navigator !== 'undefined';

export const DEFAULT_PROCESSORS = [IS_BROWSER ? BROWSER_PROCESSOR : CONSOLE_PROCESSOR];

export const parseFilter = (filter: string | string[] | LogLevel): LogFilter[] => {
  // debugger;
  console.log('parseFilter', { filter });
  if (typeof filter === 'number') {
    return [{ level: filter }];
  }

  const parseLogLevel = (level: string, defValue = LogLevel.WARN) => levels[level.toLowerCase()] ?? defValue;

  const lines = typeof filter === 'string' ? filter.split(/,\s*/) : filter;
  return lines.map((filter) => {
    const [pattern, level] = filter.split(':');
    return level ? { level: parseLogLevel(level), pattern } : { level: parseLogLevel(pattern) };
  });
};

export const getConfig = (options?: LogOptions): LogConfig => {
  const nodeOptions: LogOptions | undefined =
    'process' in globalThis
      ? {
          file: process!.env.LOG_CONFIG,
          filter: process!.env.LOG_FILTER,
          processor: process!.env.LOG_PROCESSOR,
        }
      : undefined;

  const mergedOptions: LogOptions = defaultsDeep(
    {},
    options,
    nodeOptions && loadOptions(nodeOptions.file),
    nodeOptions,
  );

  return {
    options: mergedOptions,
    filters: parseFilter(
      mergedOptions.filter ?? 'defaultparsefilter:debug,network-manager:debug,teleport:debug,echo-pipeline:debug,info',
    ),
    captureFilters: parseFilter(
      mergedOptions.captureFilter ??
        'defaultcapturefilter:debug,network-manager:debug,teleport:debug,echo-pipeline:debug,info',
    ),
    processors: mergedOptions.processor ? [processors[mergedOptions.processor]] : DEFAULT_PROCESSORS,
    prefix: mergedOptions.prefix,
  };
};
