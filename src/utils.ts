import { writeFileSync, readFileSync, existsSync, copyFileSync } from 'fs';
import { parse, encode } from 'ini';
import { ParsedConfig, CachedCredential, Profile } from './types';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ExpiredCredsError } from './errors';

export const writeConfig = <T>(filename: string, config: T): void => {
  writeFileSync(filename, encode(config), { encoding: 'utf-8', flag: 'w' });
};

export const readConfig = <T>(filename: string): ParsedConfig<T> => {
  const config = parse(
    readFileSync(filename).toString('utf-8')
  ) as ParsedConfig<T>;
  return config;
};

export const isFile = (filename: string): boolean => {
  return existsSync(filename);
};

export const createBackup = (filename: string): void => {
  if (isFile(filename)) {
    if (isFile(`${filename}.backup.firstrun`)) {
      copyFileSync(filename, `${filename}.backup`);
    } else {
      copyFileSync(filename, `${filename}.backup.firstrun`);
    }
  }
};

export const loadJson = (path: string): unknown => {
  try {
    const jsonRaw = readFileSync(path).toString('utf-8');
    return JSON.parse(jsonRaw) as unknown;
  } catch (e) {
    console.error('Ignoring invalid json', e);
  }
};

export const isMatchingStartUrl = (
  cred: CachedCredential,
  profile: Profile
): boolean => {
  return cred.startUrl === profile?.sso_start_url;
};

export const isExpired = (expiresAt: string): boolean => {
  const now = Date.now();
  const exp = new Date(expiresAt.replace('UTC', ''));
  return now > exp.getTime();
};

export const isCredential = (
  config: Profile | CachedCredential | unknown
): config is CachedCredential => {
  return Boolean(
    // https://github.com/istanbuljs/istanbuljs/issues/516
    /* istanbul ignore next */
    (config as CachedCredential)?.accessToken &&
      (config as CachedCredential).expiresAt
  );
};

export const awsSsoLogin = async (profileName: string): Promise<void> => {
  const pexec = promisify(exec);
  await pexec(`aws sso login --profile ${profileName}`);
};

export const isExpiredCredsError = (e: unknown): e is ExpiredCredsError =>
  e instanceof ExpiredCredsError;
