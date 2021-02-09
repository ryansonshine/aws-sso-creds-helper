import { writeFileSync, readFileSync, existsSync, copyFileSync } from 'fs';
import { parse, encode } from 'ini';
import { ParsedConfig, CachedCredential, Profile } from './types';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ExpiredCredsError, AwsSdkError } from './errors';
import { logger } from './logger';

export const writeConfig = <T>(filename: string, config: T): void => {
  logger.debug(`Writing config to ${filename}`);
  writeFileSync(filename, encode(config), { encoding: 'utf-8', flag: 'w' });
};

export const readConfig = <T>(filename: string): ParsedConfig<T> => {
  logger.debug(`Reading config from ${filename}`);
  const config = parse(
    readFileSync(filename).toString('utf-8')
  ) as ParsedConfig<T>;
  return config;
};

export const isFile = (filename: string): boolean => {
  return existsSync(filename);
};

export const createBackup = (filename: string): void => {
  const firstRunBackupPath = `${filename}.backup.firstrun`;
  const backupPath = `${filename}.backup`;
  if (isFile(filename)) {
    if (isFile(firstRunBackupPath)) {
      logger.debug(
        `Backup has been performed before, creating standard backup at ${backupPath}`
      );
      copyFileSync(filename, backupPath);
    } else {
      logger.debug(`Creating first time backup at ${firstRunBackupPath}`);
      copyFileSync(filename, firstRunBackupPath);
    }
  }
};

export const loadJson = (path: string): unknown => {
  logger.debug(`Reading ${path}`);
  try {
    const jsonRaw = readFileSync(path).toString('utf-8');
    return JSON.parse(jsonRaw) as unknown;
  } catch (e) {
    logger.error('Ignoring invalid json', e);
  }
};

export const isMatchingStartUrl = (
  cred: CachedCredential,
  profile: Profile
): boolean => {
  let isMatch = false;
  if (
    profile?.sso_start_url.length > 0 &&
    cred.startUrl.length != profile?.sso_start_url.length
  ) {
    isMatch = cred.startUrl.indexOf(profile?.sso_start_url) >= 0;
  } else {
    isMatch = cred.startUrl === profile?.sso_start_url;
  }
  logger.debug(
    `Credential start url ${cred.startUrl} ${
      isMatch ? 'matches' : 'does not match'
    } profile sso start url ${profile?.sso_start_url}`
  );
  return isMatch;
};

export const isExpired = (expiresAt: string): boolean => {
  const now = Date.now();
  const exp = new Date(expiresAt.replace('UTC', ''));
  const expired = now > exp.getTime();
  logger.debug(`Credential is ${expired ? '' : 'NOT '}expired`);
  return expired;
};

export const isCredential = (
  config: Profile | CachedCredential | unknown
): config is CachedCredential => {
  const isCred = Boolean(
    // https://github.com/istanbuljs/istanbuljs/issues/516
    /* istanbul ignore next */
    (config as CachedCredential)?.accessToken &&
      (config as CachedCredential).expiresAt
  );
  logger.debug(`Configuration is ${isCred ? '' : 'NOT '}a credential config`);
  return isCred;
};

export const awsSsoLogin = async (profileName: string): Promise<void> => {
  const cmd = `aws sso login --profile ${profileName}`;
  try {
    const pexec = promisify(exec);
    logger.debug(`Executing command ${cmd}`);
    await pexec(cmd);
    logger.debug(`Received callback from running ${cmd}`);
  } catch (e) {
    logger.debug(`Failed to run ${cmd}`);
    throw e;
  }
};

export const isExpiredCredsError = (e: unknown): e is ExpiredCredsError => {
  const isExpErr = e instanceof ExpiredCredsError;
  logger.debug(`Error is ${isExpErr ? '' : 'NOT '}an ExpiredCredsError`);
  return isExpErr;
};

export const isSdkError = (e: unknown): e is AwsSdkError => {
  const isSdkErr = e instanceof AwsSdkError;
  logger.debug(`Error is ${isSdkErr ? '' : 'NOT '}an AwsSdkError`);
  return isSdkErr;
};
