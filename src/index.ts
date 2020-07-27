import { homedir } from 'os';
import { join } from 'path';
import { readdirSync, copyFileSync } from 'fs';
import { SSO } from 'aws-sdk';
import { RoleCredentials } from 'aws-sdk/clients/sso';
import { Region, Profile, CachedCredential, Credential } from './types';
import {
  readConfig,
  writeConfig,
  loadJson,
  isCredential,
  isExpired,
  isMatchingStartUrl,
} from './utils';

const AWS_DEFAULT_REGION: Region = process.env.AWS_DEFAULT_REGION || 'us-east-1';
const BASE_PATH = join(homedir(), '.aws');
const AWS_CONFIG_PATH = join(BASE_PATH, 'config');
const AWS_CREDENTIAL_PATH = join(BASE_PATH, 'credentials');
const AWS_SSO_CACHE_PATH = join(BASE_PATH, 'sso', 'cache');
const AWS_PROFILE = process.argv[2] || 'default';

export const getSsoCachedLogin = (profile: Profile) => {
  const files = readdirSync(AWS_SSO_CACHE_PATH);
  const now = new Date();
  for (const file of files) {
    const data: CachedCredential = loadJson(join(AWS_SSO_CACHE_PATH, file));
    if (
      isCredential(data) &&
      !isExpired(now, data.expiresAt) &&
      isMatchingStartUrl(data, profile)
    ) {
      return data;
    }
  }
  throw new Error('Cached SSO login is expired/invalid, try running `aws sso login` and try again');
};

export const getSsoRoleCredentials = async (
  profile: Profile,
  login: CachedCredential
): Promise<RoleCredentials> => {
  const sso = new SSO({ region: profile.sso_region });
  const result = await sso
    .getRoleCredentials({
      accessToken: login.accessToken,
      accountId: profile.sso_account_id,
      roleName: profile.sso_role_name,
    })
    .promise();
  if (!result.roleCredentials) {
    throw new Error('Unable to fetch role credentials');
  }
  return result.roleCredentials;
};

export const updateAwsCredentials = (
  profileName: string,
  profile: Profile,
  credentials: RoleCredentials
) => {
  const region = profile.region || AWS_DEFAULT_REGION;
  const config = readConfig<Credential>(AWS_CREDENTIAL_PATH);
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
  copyFileSync(AWS_CREDENTIAL_PATH, `${AWS_CREDENTIAL_PATH}.backup`);
};

export const getProfile = (profileName: string): Profile => {
  const config = readConfig<Profile>(AWS_CONFIG_PATH);
  const fullProfileName = profileName === 'default' ? 'default' : `profile ${profileName}`;
  const profile = config[fullProfileName] as Profile;
  if (!profile) {
    throw new Error(`No profile found for ${profileName}`);
  }
  return profile;
};

async function run() {
  const profile = getProfile(AWS_PROFILE);
  const cachedLogin = getSsoCachedLogin(profile);
  const credentials = await getSsoRoleCredentials(profile, cachedLogin);
  updateAwsCredentials(AWS_PROFILE, profile, credentials);
}

run()
  .then(() => {
    console.info(
      `[SSO-Creds-Helper]: Successfully set credentials for SSO profile "${AWS_PROFILE}"`
    );
  })
  .catch(e => {
    console.error('[SSO-Creds-Helper]: Failed to update credentials', e);
  });
