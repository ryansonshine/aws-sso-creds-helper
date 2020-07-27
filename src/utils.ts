import { writeFileSync, readFileSync } from 'fs';
import { parse, encode } from 'ini';
import { ParsedConfig, CachedCredential, Profile } from './types';

export const writeConfig = <T>(filename: string, config: T): void => {
  writeFileSync(filename, encode(config), { encoding: 'utf-8' });
};

export const readConfig = <T>(filename: string): ParsedConfig<T> => {
  const config = parse(readFileSync(filename).toString('utf-8')) as ParsedConfig<T>;
  return config;
};

export const loadJson = (path: string) => {
  try {
    return require(path);
  } catch (e) {
    console.error('Ignoring invalid json', e);
  }
};

export const isMatchingStartUrl = (cred: CachedCredential, profile: Profile) => {
  return cred.startUrl === profile?.sso_start_url;
};

export const isExpired = (now: Date, expiresAt: string): boolean => {
  const exp = new Date(expiresAt.replace('UTC', ''));
  return now.getTime() > exp.getTime();
};

export const isCredential = (config: Profile | CachedCredential): config is CachedCredential => {
  return Boolean(
    (config as CachedCredential)?.accessToken && (config as CachedCredential).expiresAt
  );
};
