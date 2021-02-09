const mockGetRoleCredentials = jest.fn();

jest.mock('aws-sdk/clients/sso', () => {
  return class TestSSO {
    getRoleCredentials: jest.Mock;
    constructor() {
      this.getRoleCredentials = mockGetRoleCredentials;
    }
  };
});
jest.mock('fs');
jest.mock('../../utils');
jest.mock('../../aws-sdk');

import * as ssoCreds from '../../sso-creds';
import * as utils from '../../utils';
import * as awsSdk from '../../aws-sdk';
import fs from 'fs';
import { testProfile, testCredential, testRoleCredential } from '../doubles';
import {
  ExpiredCredsError,
  AwsSdkError,
  ProfileNotFoundError,
} from '../../errors';
import SSO from 'aws-sdk/clients/sso';
import { AWS_CREDENTIAL_PATH } from '../../sso-creds';
import { ParsedConfig, Credential, Profile } from '../../types';

const mockUtils = utils as jest.Mocked<typeof utils>;
const mockFs = fs as jest.Mocked<typeof fs>;
const mockSdk = awsSdk as jest.Mocked<typeof awsSdk>;

describe('sso-creds', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  describe('AWS_CREDENTIAL_PATH', () => {
    const PREV_ENV = process.env;
    beforeEach(() => {
      process.env = { ...PREV_ENV };
    });

    afterAll(() => {
      process.env = PREV_ENV;
    });

    it('should use process.env.AWS_SHARED_CREDENTIALS_FILE as the path when it exists', () => {
      const altPath = '/tmp/test-path';
      process.env.AWS_SHARED_CREDENTIALS_FILE = altPath;

      const { AWS_CREDENTIAL_PATH } = require('../../sso-creds');

      expect(AWS_CREDENTIAL_PATH).toEqual(altPath);
    });

    it('should not process.env.AWS_SHARED_CREDENTIALS_FILE as the path when none exists', () => {
      const altPath = '/tmp/test-path';
      process.env.AWS_SHARED_CREDENTIALS_FILE = undefined;

      const { AWS_CREDENTIAL_PATH } = require('../../sso-creds');

      expect(AWS_CREDENTIAL_PATH).not.toEqual(altPath);
    });
  });

  describe('getSsoCachedLogin', () => {
    it('should throw an ExpiredCredsError if the cache file is expired', () => {
      const params: Parameters<typeof ssoCreds.getSsoCachedLogin> = [
        testProfile,
      ];
      // @ts-expect-error
      mockFs.readdirSync.mockReturnValue(['test']);
      mockUtils.loadJson.mockReturnValue(testCredential);
      mockUtils.isCredential.mockReturnValue(true);
      mockUtils.isMatchingStartUrl.mockReturnValue(true);
      mockUtils.isExpired.mockReturnValue(true);

      const fn = () => ssoCreds.getSsoCachedLogin(...params);

      expect(fn).toThrowError(ExpiredCredsError);
    });

    it('should throw an ExpiredCredsError if no cache files are present', () => {
      const params: Parameters<typeof ssoCreds.getSsoCachedLogin> = [
        testProfile,
      ];
      mockFs.readdirSync.mockReturnValue([]);

      const fn = () => ssoCreds.getSsoCachedLogin(...params);

      expect(fn).toThrowError(ExpiredCredsError);
    });

    it('should return an ExpiredCredsError if startUrl does not match any cached creds', () => {
      const params: Parameters<typeof ssoCreds.getSsoCachedLogin> = [
        testProfile,
      ];
      // @ts-expect-error
      mockFs.readdirSync.mockReturnValue(['test']);
      mockUtils.loadJson.mockReturnValue(testCredential);
      mockUtils.isCredential.mockReturnValue(true);
      mockUtils.isExpired.mockReturnValue(false);
      mockUtils.isMatchingStartUrl.mockReturnValue(false);

      const fn = () => ssoCreds.getSsoCachedLogin(...params);

      expect(fn).toThrowError(ExpiredCredsError);
    });

    it('should return credentials when all conditions pass on a file', () => {
      const params: Parameters<typeof ssoCreds.getSsoCachedLogin> = [
        testProfile,
      ];
      const expected = testCredential;
      // @ts-expect-error
      mockFs.readdirSync.mockReturnValue(['test']);
      mockUtils.loadJson.mockReturnValue(expected);
      mockUtils.isCredential.mockReturnValue(true);
      mockUtils.isExpired.mockReturnValue(false);
      mockUtils.isMatchingStartUrl.mockReturnValue(true);

      const result = ssoCreds.getSsoCachedLogin(...params);

      expect(result).toEqual(expected);
    });
  });

  describe('getSsoRoleCredentials', () => {
    beforeEach(() => {
      const sso = new SSO();
      mockSdk.getSSOClient.mockReturnValue(sso);
      mockGetRoleCredentials.mockImplementation(() => ({
        promise: () => Promise.resolve({ roleCredentials: testRoleCredential }),
      }));
    });

    it('should throw an AwsSdkError if getRoleCredentials does not return credentials', async () => {
      const params: Parameters<typeof ssoCreds.getSsoRoleCredentials> = [
        testProfile,
        testCredential,
        false,
      ];
      mockGetRoleCredentials.mockImplementation(() => ({
        promise: () => Promise.resolve({}),
      }));

      const fn = () => ssoCreds.getSsoRoleCredentials(...params);

      await expect(fn).rejects.toThrowError(AwsSdkError);
    });

    it('should invoke getSSOClient with expected params', async () => {
      const params: Parameters<typeof ssoCreds.getSsoRoleCredentials> = [
        testProfile,
        testCredential,
        false,
      ];
      const expected: Parameters<typeof awsSdk.getSSOClient> = [
        params[0].sso_region,
        params[2],
      ];

      await ssoCreds.getSsoRoleCredentials(...params);

      expect(mockSdk.getSSOClient).toHaveBeenCalledWith(...expected);
    });

    it('should return roleCredentials with a successful sdk call', async () => {
      const params: Parameters<typeof ssoCreds.getSsoRoleCredentials> = [
        testProfile,
        testCredential,
        false,
      ];
      const expected = testRoleCredential;

      const result = await ssoCreds.getSsoRoleCredentials(...params);

      expect(result).toEqual(expected);
    });
  });

  describe('updateAwsCredentials', () => {
    const profileName = 'test-profileName';

    it('should create a config object for the profile passed in when no config exists', () => {
      const params: Parameters<typeof ssoCreds.updateAwsCredentials> = [
        profileName,
        testProfile,
        testRoleCredential,
      ];
      const expectedConfig: ParsedConfig<Credential> = {
        [profileName]: {
          aws_access_key_id: params[2].accessKeyId as string,
          aws_secret_access_key: params[2].secretAccessKey as string,
          aws_session_token: params[2].sessionToken,
          region: params[1].region,
        },
      };
      const expected: Parameters<typeof utils.writeConfig> = [
        AWS_CREDENTIAL_PATH,
        expectedConfig,
      ];
      mockUtils.isFile.mockReturnValue(false);

      ssoCreds.updateAwsCredentials(...params);

      expect(mockUtils.writeConfig).toHaveBeenCalledWith(...expected);
    });

    it('should revert to default values if none are found in args', () => {
      const params: Parameters<typeof ssoCreds.updateAwsCredentials> = [
        profileName,
        // @ts-expect-error
        { ...testProfile, region: undefined },
        {
          ...testRoleCredential,
          accessKeyId: undefined,
          secretAccessKey: undefined,
        },
      ];
      const expectedConfig: ParsedConfig<Credential> = {
        [profileName]: {
          aws_access_key_id: '',
          aws_secret_access_key: '',
          aws_session_token: params[2].sessionToken,
          region: 'us-east-1',
        },
      };
      const expected: Parameters<typeof utils.writeConfig> = [
        AWS_CREDENTIAL_PATH,
        expectedConfig,
      ];
      mockUtils.isFile.mockReturnValue(false);

      ssoCreds.updateAwsCredentials(...params);

      expect(mockUtils.writeConfig).toHaveBeenCalledWith(...expected);
    });

    it('should add a section to the config object when other profiles already exist', () => {
      const params: Parameters<typeof ssoCreds.updateAwsCredentials> = [
        profileName,
        testProfile,
        testRoleCredential,
      ];
      const existingConfig: ParsedConfig<Credential> = {
        profile2: {
          aws_access_key_id: '',
          aws_secret_access_key: '',
          aws_session_token: '',
          region: 'us-east-1',
        },
      };
      const expectedConfig: ParsedConfig<Credential> = {
        ...existingConfig,
        [profileName]: {
          aws_access_key_id: params[2].accessKeyId as string,
          aws_secret_access_key: params[2].secretAccessKey as string,
          aws_session_token: params[2].sessionToken,
          region: params[1].region,
        },
      };
      const expected: Parameters<typeof utils.writeConfig> = [
        AWS_CREDENTIAL_PATH,
        expectedConfig,
      ];
      mockUtils.isFile.mockReturnValue(true);
      mockUtils.readConfig.mockReturnValue(existingConfig);

      ssoCreds.updateAwsCredentials(...params);

      expect(mockUtils.writeConfig).toHaveBeenCalledWith(...expected);
    });

    it('should make a call to backupCredentials before writing to config', () => {
      const params: Parameters<typeof ssoCreds.updateAwsCredentials> = [
        profileName,
        testProfile,
        testRoleCredential,
      ];
      const callOrder: string[] = [];
      const expected = ['backup', 'write'];
      mockUtils.createBackup.mockImplementation(() => callOrder.push('backup'));
      mockUtils.writeConfig.mockImplementation(() => callOrder.push('write'));

      ssoCreds.updateAwsCredentials(...params);

      expect(callOrder).toEqual(expected);
    });
  });

  describe('getProfile', () => {
    it('should use default as the profile name when default is provided', () => {
      const profileName = 'default';
      const config: ParsedConfig<Profile> = {
        [profileName]: testProfile,
      };
      mockUtils.readConfig.mockReturnValue(config);

      const result = ssoCreds.getProfile(profileName);

      expect(result).toEqual(testProfile);
    });

    it('should prepend "profile " to the profile name if the profile is not default', () => {
      const profileName = 'my-profile';
      const config: ParsedConfig<Profile> = {
        [`profile ${profileName}`]: testProfile,
      };
      mockUtils.readConfig.mockReturnValue(config);

      const result = ssoCreds.getProfile(profileName);

      expect(result).toEqual(testProfile);
    });

    it('should throw a ProfileNotFoundError when no profile is found', () => {
      const profileName = 'default';
      const config: ParsedConfig<Profile> = {};
      mockUtils.readConfig.mockReturnValue(config);

      const fn = () => ssoCreds.getProfile(profileName);

      expect(fn).toThrowError(ProfileNotFoundError);
    });
  });

  describe('run', () => {
    const profileName = 'test-profileName';

    it('should update aws credentials when all subsequent calls pass', async () => {
      const params: Parameters<typeof ssoCreds.run> = [{ profileName }];
      const expected: Parameters<typeof ssoCreds.updateAwsCredentials> = [
        profileName,
        testProfile,
        testRoleCredential,
      ];
      const updateAwsCredentials = jest.spyOn(ssoCreds, 'updateAwsCredentials');
      jest.spyOn(ssoCreds, 'getProfile').mockReturnValue(testProfile);
      jest.spyOn(ssoCreds, 'getSsoCachedLogin').mockReturnValue(testCredential);
      jest
        .spyOn(ssoCreds, 'getSsoRoleCredentials')
        .mockResolvedValue(testRoleCredential);

      await ssoCreds.run(...params);

      expect(updateAwsCredentials).toHaveBeenCalledWith(...expected);
    });

    it('should throw an error on first execution with errors unrelated to credential expiration', async () => {
      const params: Parameters<typeof ssoCreds.run> = [{ profileName }];
      jest.spyOn(ssoCreds, 'getProfile').mockReturnValue(testProfile);
      jest.spyOn(ssoCreds, 'getSsoCachedLogin').mockReturnValue(testCredential);
      jest
        .spyOn(ssoCreds, 'getSsoRoleCredentials')
        .mockRejectedValue(new AwsSdkError());

      const fn = () => ssoCreds.run(...params);

      await expect(fn).rejects.toThrow();
    });

    it('should call awsSsoLogin the first time an expired creds error is thrown', async () => {
      const params: Parameters<typeof ssoCreds.run> = [{ profileName }];
      jest.spyOn(ssoCreds, 'getProfile').mockReturnValueOnce(testProfile);
      jest.spyOn(ssoCreds, 'getSsoCachedLogin').mockImplementationOnce(() => {
        throw new ExpiredCredsError();
      });
      jest
        .spyOn(ssoCreds, 'getSsoRoleCredentials')
        .mockResolvedValueOnce(testRoleCredential);
      mockUtils.isExpiredCredsError.mockReturnValueOnce(true);

      await ssoCreds.run(...params);

      expect(mockUtils.awsSsoLogin).toHaveBeenCalledTimes(1);
    });
  });
});
