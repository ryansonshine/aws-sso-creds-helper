import { ExpiredCredsError, AwsSdkError } from './errors';
import { logger } from './logger';
import {
  ProfileV1,
  ProfileV2,
  SSOSessionProfile,
  CachedCredential,
  ConfigFileEntry,
} from './types';

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

export const isCredential = (
  config: ConfigFileEntry | CachedCredential | unknown
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

export const isProfileV1 = (profile: unknown): profile is ProfileV1 => {
  const isV1 = Boolean(
    /* istanbul ignore next */
    (profile as ProfileV1)?.sso_start_url && (profile as ProfileV1).sso_region
  );
  logger.debug(`Loaded profile is version ${isV1 ? '1' : ''}`);
  return isV1;
};

export const isProfileV2 = (profile: unknown): profile is ProfileV2 => {
  /* istanbul ignore next */
  const isV2 = Boolean((profile as ProfileV2)?.sso_session);
  logger.debug(`Loaded profile is version ${isV2 ? '2' : ''}`);
  return isV2;
};

export const isSSOSessionProfile = (
  profile: unknown
): profile is SSOSessionProfile => {
  const isSSOProfile = Boolean(
    /* istanbul ignore next */
    (profile as SSOSessionProfile)?.sso_region &&
      (profile as SSOSessionProfile).sso_registration_scopes &&
      (profile as SSOSessionProfile).sso_start_url
  );
  logger.debug(
    `Loaded profile is ${isSSOProfile ? '' : 'NOT '}an SSO profile.`
  );
  return isSSOProfile;
};
