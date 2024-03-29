import {
  AccessTokenType,
  RoleNameType,
  AccountIdType,
} from 'aws-sdk/clients/sso';

export interface RunArgs {
  profileName: string;
  proxyEnabled?: boolean;
}

export type ConfigFileEntry = ProfileV1 | ProfileV2 | SSOSessionProfile;

export interface MappedProfile {
  output: Output;
  region: Region;
  sso_account_id: AccountIdType;
  sso_region: Region;
  sso_role_name: RoleNameType;
  sso_start_url: string;
}

/**
 * Profile with legacy non-refreshable configuration.
 */
export type ProfileV1 = MappedProfile;

/**
 * Profile with SSO token provider configuration.
 */
export interface ProfileV2 {
  output: Output;
  region: Region;
  sso_account_id: string;
  sso_role_name: string;
  sso_session: string;
}

/**
 * SSO Sesssion profile when using profiles configured with the SSO token
 * provider configuration.
 */
export interface SSOSessionProfile {
  sso_region: Region;
  sso_registration_scopes: string;
  sso_start_url: string;
}

export interface Credential {
  region?: Region;
  aws_access_key_id: string;
  aws_secret_access_key: string;
  aws_session_token?: string;
}

export interface CachedCredential {
  accessToken: AccessTokenType;
  expiresAt: string;
  region: Region;
  startUrl: string;
}

export interface ParsedConfig<T> {
  [key: string]: T;
}

export type Output = 'json' | 'yaml' | 'text' | 'table';
export type Region =
  | 'af-south-1'
  | 'ap-east-1'
  | 'ap-northeast-1'
  | 'ap-northeast-2'
  | 'ap-northeast-3'
  | 'ap-south-1'
  | 'ap-southeast-1'
  | 'ap-southeast-2'
  | 'ca-central-1'
  | 'cn-north-1'
  | 'cn-northwest-1'
  | 'eu-central-1'
  | 'eu-north-1'
  | 'eu-south-1'
  | 'eu-west-1'
  | 'eu-west-2'
  | 'eu-west-3'
  | 'me-south-1'
  | 'sa-east-1'
  | 'us-east-1'
  | 'us-east-2'
  | 'us-gov-east-1'
  | 'us-gov-west-1'
  | 'us-west-1'
  | 'us-west-2';
