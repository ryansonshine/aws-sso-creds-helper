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
import {
  testProfileV1,
  testCredential,
  testRoleCredential,
  testProfileV2,
} from '../doubles';
import {
  ExpiredCredsError,
  AwsSdkError,
  ProfileNotFoundError,
} from '../../errors';
import SSO from 'aws-sdk/clients/sso';
import { AWS_CREDENTIAL_PATH } from '../../sso-creds';
import { ParsedConfig, Credential, ConfigFileEntry } from '../../types';

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
        testProfileV1,
      ];
      mockUtils.loadJson.mockReturnValue(testCredential);
      mockUtils.isMatchingStartUrl.mockReturnValue(true);
      mockUtils.isExpired.mockReturnValue(true);
      mockUtils.getFilesFromDirectory.mockReturnValue(['test.json']);

      const fn = () => ssoCreds.getSsoCachedLogin(...params);

      expect(fn).toThrowError(ExpiredCredsError);
    });

    it('should throw an ExpiredCredsError if no cache files are present', () => {
      const params: Parameters<typeof ssoCreds.getSsoCachedLogin> = [
        testProfileV1,
      ];
      mockUtils.getFilesFromDirectory.mockReturnValue([]);

      const fn = () => ssoCreds.getSsoCachedLogin(...params);

      expect(fn).toThrowError(ExpiredCredsError);
    });

    it('should return an ExpiredCredsError if startUrl does not match any cached creds', () => {
      const params: Parameters<typeof ssoCreds.getSsoCachedLogin> = [
        testProfileV1,
      ];
      mockUtils.loadJson.mockReturnValue(testCredential);
      mockUtils.isExpired.mockReturnValue(false);
      mockUtils.isMatchingStartUrl.mockReturnValue(false);
      mockUtils.getFilesFromDirectory.mockReturnValue(['test.json']);

      const fn = () => ssoCreds.getSsoCachedLogin(...params);

      expect(fn).toThrowError(ExpiredCredsError);
    });

    it('should return credentials when all conditions pass on a file', () => {
      const params: Parameters<typeof ssoCreds.getSsoCachedLogin> = [
        testProfileV1,
      ];
      const expected = testCredential;
      mockUtils.loadJson.mockReturnValue(expected);
      mockUtils.isExpired.mockReturnValue(false);
      mockUtils.isMatchingStartUrl.mockReturnValue(true);
      mockUtils.getFilesFromDirectory.mockReturnValue(['test.json']);

      const result = ssoCreds.getSsoCachedLogin(...params);

      expect(result).toEqual(expected);
    });

    it('should skip checking non json files', () => {
      const params: Parameters<typeof ssoCreds.getSsoCachedLogin> = [
        testProfileV1,
      ];
      mockUtils.loadJson.mockReturnValue(testCredential);
      mockUtils.isExpired.mockReturnValue(false);
      mockUtils.isMatchingStartUrl.mockReturnValue(true);
      mockUtils.getFilesFromDirectory.mockReturnValue([
        'test.html',
        'valid.json',
      ]);

      ssoCreds.getSsoCachedLogin(...params);

      expect(mockUtils.loadJson).not.toHaveBeenCalledWith(
        `${ssoCreds.AWS_SSO_CACHE_PATH}/test.html`
      );
      expect(mockUtils.loadJson).toHaveBeenCalledWith(
        `${ssoCreds.AWS_SSO_CACHE_PATH}/valid.json`
      );
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
        testProfileV1,
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
        testProfileV1,
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
        testProfileV1,
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
        testProfileV1,
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
        { ...testProfileV1, region: undefined },
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
        testProfileV1,
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
        testProfileV1,
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
      const config: ParsedConfig<ConfigFileEntry> = {
        [profileName]: testProfileV1,
      };
      mockUtils.readConfig.mockReturnValue(config);

      const result = ssoCreds.getProfile(profileName);

      expect(result).toEqual(testProfileV1);
    });

    it('should prepend "profile " to the profile name if the profile is not default', () => {
      const profileName = 'my-profile';
      const config: ParsedConfig<ConfigFileEntry> = {
        [`profile ${profileName}`]: testProfileV1,
      };
      mockUtils.readConfig.mockReturnValue(config);

      const result = ssoCreds.getProfile(profileName);

      expect(result).toEqual(testProfileV1);
    });

    it('should throw a ProfileNotFoundError when no profile is found', () => {
      const profileName = 'default';
      const config: ParsedConfig<ConfigFileEntry> = {};
      mockUtils.readConfig.mockReturnValue(config);

      const fn = () => ssoCreds.getProfile(profileName);

      expect(fn).toThrowError(ProfileNotFoundError);
    });

    it('should get the start_url from the sso-session when the profile is v2', () => {
      const profileName = 'v2';
      const sessionName = 'my-session-name';
      const startUrl = 'https://example.awsapps.com/start/';
      const config: ParsedConfig<ConfigFileEntry> = {
        [`profile ${profileName}`]: {
          ...testProfileV2,
          sso_session: sessionName,
        },
        [`sso-session ${sessionName}`]: {
          sso_start_url: startUrl,
          sso_region: 'us-east-1',
          sso_registration_scopes: 'sso:account:access',
        },
      };
      mockUtils.readConfig.mockReturnValue(config);

      const result = ssoCreds.getProfile(profileName);

      expect(result.sso_start_url).toEqual(startUrl);
    });
  });

  describe('run', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    const profileName = 'test-profileName';

    it('should update aws credentials when all subsequent calls pass', async () => {
      const params: Parameters<typeof ssoCreds.run> = [{ profileName }];
      const expected: Parameters<typeof ssoCreds.updateAwsCredentials> = [
        profileName,
        testProfileV1,
        testRoleCredential,
      ];
      const updateAwsCredentials = jest.spyOn(ssoCreds, 'updateAwsCredentials');
      jest.spyOn(ssoCreds, 'getProfile').mockReturnValue(testProfileV1);
      jest.spyOn(ssoCreds, 'getSsoCachedLogin').mockReturnValue(testCredential);
      jest
        .spyOn(ssoCreds, 'getSsoRoleCredentials')
        .mockResolvedValue(testRoleCredential);

      await ssoCreds.run(...params);

      expect(updateAwsCredentials).toHaveBeenCalledWith(...expected);
    });

    it('should throw an error on first execution with errors unrelated to credential expiration', async () => {
      const params: Parameters<typeof ssoCreds.run> = [{ profileName }];
      jest.spyOn(ssoCreds, 'getProfile').mockReturnValue(testProfileV1);
      jest.spyOn(ssoCreds, 'getSsoCachedLogin').mockReturnValue(testCredential);
      jest
        .spyOn(ssoCreds, 'getSsoRoleCredentials')
        .mockRejectedValue(new AwsSdkError());

      const fn = () => ssoCreds.run(...params);

      await expect(fn).rejects.toThrow();
    });
  });
});
