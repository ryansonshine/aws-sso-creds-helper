import { homedir } from 'os';
import { join } from 'path';
import { readFileSync, readdirSync, copyFileSync, writeFileSync } from 'fs';
import { parse, encode } from 'ini';
import { Region, ParsedConfig, Profile, CachedCredential, Credential } from './types';
import { SSO } from 'aws-sdk';
import { RoleCredentials } from 'aws-sdk/clients/sso';

const AWS_DEFAULT_REGION: Region = (process.env.AWS_DEFAULT_REGION as Region) || 'us-east-1';
const BASE_PATH = join(homedir(), '.aws');
const AWS_CONFIG_PATH = join(BASE_PATH, 'config');
const AWS_CREDENTIAL_PATH = join(BASE_PATH, 'credentials');
const AWS_SSO_CACHE_PATH = join(BASE_PATH, 'sso', 'cache');

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
  throw new Error('Cached SSO login is expired/invalid');
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
  return config[fullProfileName] as Profile;
};

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
  return cred.startUrl === profile.sso_start_url;
};

export const isExpired = (now: Date, expiresAt: string): boolean => {
  const exp = new Date(expiresAt);
  return now.getTime() > exp.getTime();
};

export const isCredential = (config: Profile | CachedCredential): config is CachedCredential => {
  return Boolean(
    (config as CachedCredential)?.accessToken && (config as CachedCredential).expiresAt
  );
};

async function run() {
  const profile = getProfile('test');
  const cachedLogin = getSsoCachedLogin(profile);
  const credentials = await getSsoRoleCredentials(profile, cachedLogin);
  updateAwsCredentials('test', profile, credentials);
}

run().then(() => {
  console.log('done!');
});
