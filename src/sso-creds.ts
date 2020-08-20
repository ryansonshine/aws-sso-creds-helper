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

const BASE_PATH = join(homedir(), '.aws');
const AWS_CONFIG_PATH = join(BASE_PATH, 'config');
const AWS_CREDENTIAL_PATH = join(BASE_PATH, 'credentials');
const AWS_SSO_CACHE_PATH = join(BASE_PATH, 'sso', 'cache');
let failedAttempts = 0;

export const getSsoCachedLogin = (profile: Profile): CachedCredential => {
  const files = readdirSync(AWS_SSO_CACHE_PATH);
  const now = new Date();
  for (const file of files) {
    const data = loadJson(join(AWS_SSO_CACHE_PATH, file));
    if (
      isCredential(data) &&
      !isExpired(now, data.expiresAt) &&
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
  const config = isFile(AWS_CREDENTIAL_PATH) ? readConfig<Credential>(AWS_CREDENTIAL_PATH) : {};
  config[profileName] = {
    aws_access_key_id: credentials.accessKeyId || '',
    aws_secret_access_key: credentials.secretAccessKey || '',
    aws_session_token: credentials.sessionToken,
    region,
  };
  backupCredentials();
  writeConfig(AWS_CREDENTIAL_PATH, config);
};

export const backupCredentials = (): void => {
  createBackup(AWS_CREDENTIAL_PATH);
};

export const getProfile = (profileName: string): Profile => {
  const config = readConfig<Profile>(AWS_CONFIG_PATH);
  const fullProfileName = profileName === 'default' ? 'default' : `profile ${profileName}`;
  const profile = config[fullProfileName];
  if (!profile) {
    throw new ProfileNotFoundError(profileName);
  }
  return profile;
};

export async function run({ profileName, proxyEnabled = false }: RunArgs): Promise<void> {
  try {
    const profile = getProfile(profileName);
    const cachedLogin = getSsoCachedLogin(profile);
    const credentials = await getSsoRoleCredentials(profile, cachedLogin, proxyEnabled);
    updateAwsCredentials(profileName, profile, credentials);
  } catch (e) {
    if (isExpiredCredsError(e) && failedAttempts <= 2) {
      failedAttempts++;
      if (failedAttempts === 1) {
        await awsSsoLogin(profileName);
      }
      return run({ profileName, proxyEnabled });
    }
    throw e;
  }
}
