import { Profile, CachedCredential } from '../../types';

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
