import { homedir } from 'os';
import { join } from 'path';
import { readdirSync } from 'fs';
import { RoleCredentials } from 'aws-sdk/clients/sso';
import { Profile, CachedCredential, Credential, RunArgs } from './types';
import {
  readConfig,
  writeConfig,
  loadJson,
  isCredential,
  isExpired,
  isMatchingStartUrl,
  isFile,
  createBackup,
  awsSsoLogin,
  isExpiredCredsError,
} from './utils';
import { ExpiredCredsError, AwsSdkError, ProfileNotFoundError } from './errors';
import { getSSOClient } from './aws-sdk';

export const BASE_PATH = join(homedir(), '.aws');
export const AWS_CONFIG_PATH = join(BASE_PATH, 'config');
export const AWS_CREDENTIAL_PATH = join(BASE_PATH, 'credentials');
export const AWS_SSO_CACHE_PATH = join(BASE_PATH, 'sso', 'cache');
let failedAttempts = 0;

export const getSsoCachedLogin = (profile: Profile): CachedCredential => {
  const files = readdirSync(AWS_SSO_CACHE_PATH);
  for (const file of files) {
    const data = loadJson(join(AWS_SSO_CACHE_PATH, file));
    if (
      isCredential(data) &&
      !isExpired(data.expiresAt) &&
      isMatchingStartUrl(data, profile)
    ) {
      return data;
    }
  }
  throw new ExpiredCredsError();
};

export const getSsoRoleCredentials = async (
  profile: Profile,
  login: CachedCredential,
  useProxy: boolean
): Promise<RoleCredentials> => {
  const sso = getSSOClient(profile.sso_region, useProxy);
  const result = await sso
    .getRoleCredentials({
      accessToken: login.accessToken,
      accountId: profile.sso_account_id,
      roleName: profile.sso_role_name,
    })
    .promise();
  if (!result.roleCredentials) {
    throw new AwsSdkError();
  }
  return result.roleCredentials;
};

export const updateAwsCredentials = (
  profileName: string,
  profile: Profile,
  credentials: RoleCredentials
): void => {
  const region = profile.region || 'us-east-1';
  const config = isFile(AWS_CREDENTIAL_PATH)
    ? readConfig<Credential>(AWS_CREDENTIAL_PATH)
    : {};

  config[profileName] = {
    aws_access_key_id: credentials.accessKeyId || '',
    aws_secret_access_key: credentials.secretAccessKey || '',
    aws_session_token: credentials.sessionToken,
    region,
  };

  createBackup(AWS_CREDENTIAL_PATH);
  writeConfig(AWS_CREDENTIAL_PATH, config);
};

export const getProfile = (profileName: string): Profile => {
  const config = readConfig<Profile>(AWS_CONFIG_PATH);
  const fullProfileName =
    profileName === 'default' ? 'default' : `profile ${profileName}`;
  const profile = config[fullProfileName];

  if (!profile) {
    throw new ProfileNotFoundError(profileName);
  }

  return profile;
};

export const run = async ({
  profileName,
  proxyEnabled = false,
}: RunArgs): Promise<void> => {
  try {
    const profile = getProfile(profileName);
    const cachedLogin = getSsoCachedLogin(profile);
    const credentials = await getSsoRoleCredentials(
      profile,
      cachedLogin,
      proxyEnabled
    );
    updateAwsCredentials(profileName, profile, credentials);
  } catch (e) {
    if (isExpiredCredsError(e) && !failedAttempts) {
      failedAttempts++;
      await awsSsoLogin(profileName);
      await run({ profileName, proxyEnabled });
    } else {
      throw e;
    }
  }
};
