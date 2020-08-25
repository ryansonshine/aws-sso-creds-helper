import { Profile, CachedCredential } from '../../types';
import { RoleCredentials } from 'aws-sdk/clients/sso';

export const testProfile: Profile = {
  output: 'json',
  region: 'us-east-1',
  sso_account_id: 'test-account-id',
  sso_region: 'us-east-1',
  sso_role_name: 'test-role-name',
  sso_start_url: 'test-start-url',
};

export const testCredential: CachedCredential = {
  accessToken: 'test-accessToken',
  expiresAt: new Date().toISOString(),
  region: 'us-east-1',
  startUrl: 'test-startUrl',
};

export const testRoleCredential: RoleCredentials = {
  accessKeyId: 'test-accessKeyId',
  expiration: 1598368519475,
  secretAccessKey: 'test-secretAccessKey',
  sessionToken: 'test-sessionToken',
};
