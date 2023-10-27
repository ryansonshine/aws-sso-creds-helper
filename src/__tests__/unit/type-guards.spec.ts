import { ExpiredCredsError, AwsSdkError } from '../../errors';
import {
  isExpiredCredsError,
  isSdkError,
  isCredential,
  isProfileV1,
  isProfileV2,
  isSSOSessionProfile,
} from '../../type-guards';
import {
  CachedCredential,
  ProfileV1,
  ProfileV2,
  SSOSessionProfile,
} from '../../types';
import { testCredential, testProfileV1, testProfileV2 } from '../doubles';

describe('type guards', () => {
  describe('isExpiredCredsError', () => {
    it('should return true when passed an instance of ExpiredCredsError', () => {
      const error = new ExpiredCredsError();

      expect(isExpiredCredsError(error)).toBe(true);
    });

    it('should return false when passed a generic error', () => {
      const error = new Error();

      expect(isExpiredCredsError(error)).toBe(false);
    });
  });

  describe('isSdkError', () => {
    it('should return true when passed an instance of AwsSdkError', () => {
      const error = new AwsSdkError();

      expect(isSdkError(error)).toBe(true);
    });

    it('should return false when passed a generic error', () => {
      const error = new Error();

      expect(isSdkError(error)).toBe(false);
    });
  });

  describe('isCredential', () => {
    it('should return true when a credential is passed', () => {
      const validCredential: CachedCredential = testCredential;

      expect(isCredential(validCredential)).toBe(true);
    });

    it('should return false when an object without required props is passed', () => {
      const validCredential: CachedCredential = {
        ...testCredential,
      };
      delete (validCredential as Partial<CachedCredential>).accessToken;

      expect(isCredential(validCredential)).toBe(false);
    });
  });

  describe('isProfileV1', () => {
    it('should return true when profile version 1 is provided', () => {
      const v1: ProfileV1 = testProfileV1;

      expect(isProfileV1(v1)).toBe(true);
    });

    it('should return false when profile version 2 is provided', () => {
      const v2: ProfileV2 = testProfileV2;

      expect(isProfileV1(v2)).toBe(false);
    });
  });

  describe('isProfileV2', () => {
    it('should return true when profile version 1 is provided', () => {
      const v2: ProfileV2 = testProfileV2;

      expect(isProfileV2(v2)).toBe(true);
    });

    it('should return false when profile version 2 is provided', () => {
      const v1: ProfileV1 = testProfileV1;

      expect(isProfileV2(v1)).toBe(false);
    });
  });

  describe('isSSOSessionProfile', () => {
    it('should return true when a valid sso session profile is provided', () => {
      const ssoProfile: SSOSessionProfile = {
        sso_region: 'us-east-1',
        sso_registration_scopes: 'sso:account:access',
        sso_start_url: 'https://example.com',
      };

      expect(isSSOSessionProfile(ssoProfile)).toBe(true);
    });

    it('should return false when an invalid sso session profile is provided', () => {
      const ssoProfile: SSOSessionProfile = {
        sso_region: 'us-east-1',
        sso_registration_scopes: 'sso:account:access',
        sso_start_url: 'https://example.com',
      };
      delete (ssoProfile as Partial<SSOSessionProfile>).sso_start_url;

      expect(isSSOSessionProfile(ssoProfile)).toBe(false);
    });
  });
});
