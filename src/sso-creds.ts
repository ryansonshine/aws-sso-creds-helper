import { homedir } from 'os';
import { join } from 'path';
import { RoleCredentials } from 'aws-sdk/clients/sso';
import {
  ConfigFileEntry,
  CachedCredential,
  Credential,
  RunArgs,
  MappedProfile,
} from './types';
import {
  readConfig,
  writeConfig,
  loadJson,
  isExpired,
  isMatchingStartUrl,
  isFile,
  createBackup,
  awsSsoLogin,
  getFilesFromDirectory,
} from './utils';
import {
  AwsSdkError,
  ExpiredCredsError,
  ProfileNotFoundError,
  InvalidProfile,
} from './errors';
import { getSSOClient, setSdkProfile } from './aws-sdk';
import { logger } from './logger';
import {
  isProfileV2,
  isSSOSessionProfile,
  isCredential,
  isProfileV1,
  isExpiredCredsError,
  isSdkError,
} from './type-guards';

export const BASE_PATH = join(homedir(), '.aws');
export const AWS_CONFIG_PATH = join(BASE_PATH, 'config');
export const AWS_CREDENTIAL_PATH =
  process.env.AWS_SHARED_CREDENTIALS_FILE || join(BASE_PATH, 'credentials');
export const AWS_SSO_CACHE_PATH = join(BASE_PATH, 'sso', 'cache');
let failedAttempts = 0;

export const getSsoCachedLogin = (profile: MappedProfile): CachedCredential => {
  const files = getFilesFromDirectory(AWS_SSO_CACHE_PATH);
  logger.debug(
    `Found ${files.length} cache files in ${AWS_SSO_CACHE_PATH}:\n${files.join(
      '\n'
    )}`
  );
  for (const file of files) {
    if (!file.includes('.json')) {
      continue;
    }
    const cachedFilePath = join(AWS_SSO_CACHE_PATH, file);
    logger.debug(`Checking ${file} in ${cachedFilePath}`);
    const data = loadJson(cachedFilePath);
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
  profile: MappedProfile,
  login: CachedCredential,
  useProxy: boolean
): Promise<RoleCredentials> => {
  try {
    const sso = getSSOClient(profile.sso_region, useProxy);
    const result = await sso
      .getRoleCredentials({
        accessToken: login.accessToken,
        accountId: profile.sso_account_id,
        roleName: profile.sso_role_name,
      })
      .promise();
    if (!result.roleCredentials) {
      logger.debug('AWS SDK did not return role credentials');
      throw new AwsSdkError();
    }

    return result.roleCredentials;
  } catch (e) {
    logger.debug('Failed to get role credentials');
    throw e;
  }
};

export const updateAwsCredentials = (
  profileName: string,
  profile: MappedProfile,
  credentials: RoleCredentials
): void => {
  const region = profile.region || 'us-east-1';
  const config = isFile(AWS_CREDENTIAL_PATH)
    ? readConfig<Credential>(AWS_CREDENTIAL_PATH)
    : {};
  logger.debug(
    `Updating credentials for profile ${profileName} in region ${region} in ${AWS_CREDENTIAL_PATH}`
  );
  config[profileName] = {
    aws_access_key_id: credentials.accessKeyId || '',
    aws_secret_access_key: credentials.secretAccessKey || '',
    aws_session_token: credentials.sessionToken,
    region,
  };

  createBackup(AWS_CREDENTIAL_PATH);
  writeConfig(AWS_CREDENTIAL_PATH, config);
};

export const getProfile = (profileName: string): MappedProfile => {
  const config = readConfig<ConfigFileEntry>(AWS_CONFIG_PATH);
  const fullProfileName =
    profileName === 'default' ? 'default' : `profile ${profileName}`;
  logger.debug(`Full profile name for lookup is ${fullProfileName}`);
  const profile = config[fullProfileName];

  if (!profile) {
    throw new ProfileNotFoundError(profileName);
  }
  logger.debug('Profile data:', JSON.stringify(profile, null, 2));
  setSdkProfile(profileName);

  if (isProfileV2(profile)) {
    const ssoConfig = config[`sso-session ${profile.sso_session}`];
    if (!isSSOSessionProfile(ssoConfig)) {
      throw new InvalidProfile(profile.sso_session);
    }

    return {
      ...profile,
      sso_start_url: ssoConfig.sso_start_url,
      sso_region: ssoConfig.sso_region,
    };
  } else if (isProfileV1(profile)) {
    return profile;
  } else {
    throw new InvalidProfile(profileName);
  }
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
    if ((isExpiredCredsError(e) || isSdkError(e)) && !failedAttempts) {
      logger.debug(
        'Failed on first pass to get credentials, incrementing failed attempts and trying again'
      );
      failedAttempts++;
      await awsSsoLogin(profileName);
      await run({ profileName, proxyEnabled });
    } else {
      throw e;
    }
  }
};
