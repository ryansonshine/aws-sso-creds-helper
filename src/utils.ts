import { writeFileSync, readFileSync, existsSync, copyFileSync } from 'fs';
import { parse, encode } from 'ini';
import { ParsedConfig, CachedCredential, Profile } from './types';
import { exec as cpExec } from 'child_process';
import { promisify } from 'util';

export const writeConfig = <T>(filename: string, config: T): void => {
  writeFileSync(filename, encode(config), { encoding: 'utf-8', flag: 'w' });
};

export const readConfig = <T>(filename: string): ParsedConfig<T> => {
  const config = parse(readFileSync(filename).toString('utf-8')) as ParsedConfig<T>;
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
    return require(path) as unknown;
  } catch (e) {
    console.error('Ignoring invalid json', e);
  }
};

export const isMatchingStartUrl = (cred: CachedCredential, profile: Profile): boolean => {
  return cred.startUrl === profile?.sso_start_url;
};

export const isExpired = (now: Date, expiresAt: string): boolean => {
  const exp = new Date(expiresAt.replace('UTC', ''));
  return now.getTime() > exp.getTime();
};

export const isCredential = (
  config: Profile | CachedCredential | unknown
): config is CachedCredential => {
  return Boolean(
    (config as CachedCredential)?.accessToken && (config as CachedCredential).expiresAt
  );
};

export const awsSsoLogin = async (profileName: string): Promise<void> => {
  const exec = promisify(cpExec);
  await exec(`aws sso login --profile ${profileName}`);
};
