import fs from 'fs';
import cp from 'child_process';
import nodeUtil from 'util';
import * as utils from '../../utils';
import { CachedCredential, MappedProfile } from '../../types';
import { testCredential, testProfileV1 } from '../doubles';
import { logger } from '../../logger';
import { cwd } from 'process';

const filename = '/tmp/filename';

describe('utils', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('writeConfig', () => {
    it('should invoke writeFileSync with the provided filename and an encoded config from args', () => {
      const writeFileSync = jest.spyOn(fs, 'writeFileSync');
      const config = {};
      const expected = [filename, '', expect.any(Object)];

      utils.writeConfig<Record<string, unknown>>(filename, config);

      expect(writeFileSync).toHaveBeenCalledWith(...expected);
    });
  });

  describe('readConfig', () => {
    it('should invoke readFileSync with the provided filename', () => {
      const readFileSync = jest.spyOn(fs, 'readFileSync');
      const expected = [filename];

      utils.readConfig(filename);

      expect(readFileSync).toHaveBeenCalledWith(...expected);
    });
  });

  describe('getFilesFromDirectory', () => {
    it('should create a new directory if the existing directory does not exist', () => {
      const mkdirSync = jest
        .spyOn(fs, 'mkdirSync')
        .mockImplementationOnce(() => '');
      const existsSync = jest
        .spyOn(fs, 'existsSync')
        .mockReturnValueOnce(false);

      utils.getFilesFromDirectory(cwd());

      expect(existsSync).toHaveBeenCalledTimes(1);
      expect(mkdirSync).toHaveBeenCalledTimes(1);
    });

    it('should NOT create a new directory if the existing directory DOES exist', () => {
      const mkdirSync = jest
        .spyOn(fs, 'mkdirSync')
        .mockImplementationOnce(() => '');
      const existsSync = jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);

      utils.getFilesFromDirectory(cwd());

      expect(existsSync).toHaveBeenCalledTimes(1);
      expect(mkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('isFile', () => {
    it('should invoke existsSync with the provided filename', () => {
      const existsSync = jest.spyOn(fs, 'existsSync');
      const expected = [filename];

      utils.isFile(filename);

      expect(existsSync).toHaveBeenCalledWith(...expected);
    });
  });

  describe('createBackup', () => {
    it('should not create a backup if no file exists', () => {
      const isFile = jest.spyOn(utils, 'isFile');
      const copyFileSync = jest.spyOn(fs, 'copyFileSync');
      isFile.mockReturnValue(false);

      utils.createBackup(filename);

      expect(copyFileSync).not.toHaveBeenCalled();
    });

    it('should create a .backup.firstrun if no backup has been made before', () => {
      const copyFileSync = jest.spyOn(fs, 'copyFileSync');
      const expected = [filename, `${filename}.backup.firstrun`];
      jest
        .spyOn(utils, 'isFile')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      utils.createBackup(filename);

      expect(copyFileSync).toHaveBeenCalledWith(...expected);
    });

    it('should create a .backup if a firstrun backup already exists', () => {
      const copyFileSync = jest.spyOn(fs, 'copyFileSync');
      const expected = [filename, `${filename}.backup`];
      jest.spyOn(utils, 'isFile').mockReturnValue(true);

      utils.createBackup(filename);

      expect(copyFileSync).toHaveBeenCalledWith(...expected);
    });
  });

  describe('loadJson', () => {
    it('should return undefined if invalid json is found', () => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue('///');

      const result = utils.loadJson(filename);

      expect(result).toBeUndefined();
    });

    it('should invoke readFileSync with the provided path', () => {
      const readFileSync = jest.spyOn(fs, 'readFileSync');
      const expected = [filename];

      utils.loadJson(filename);

      expect(readFileSync).toHaveBeenCalledWith(...expected);
    });
  });

  describe('isMatchingStartUrl', () => {
    it('should return true on matching urls', () => {
      const startUrl = 'test-startUrl';
      const cred: CachedCredential = {
        ...testCredential,
        startUrl,
      };
      const profile: MappedProfile = {
        ...testProfileV1,
        sso_start_url: startUrl,
      };

      const result = utils.isMatchingStartUrl(cred, profile);

      expect(result).toBe(true);
    });

    it('should return true on mostly matching urls', () => {
      const startUrl = 'test-startUrl';
      const startLikeUrl = 'test-startUrl#/';
      const cred: CachedCredential = {
        ...testCredential,
        startUrl: startLikeUrl,
      };
      const profile: MappedProfile = {
        ...testProfileV1,
        sso_start_url: startUrl,
      };

      const result = utils.isMatchingStartUrl(cred, profile);

      expect(result).toBe(true);
    });

    it('should return false when profile does not exist', () => {
      const cred = testCredential;
      const profile = undefined;

      // @ts-expect-error Testing profile as undefined
      const result = utils.isMatchingStartUrl(cred, profile);

      expect(result).toBe(false);
    });

    it('should return false on un-matched urls', () => {
      const startUrl = 'test-startUrl';
      const cred: CachedCredential = {
        ...testCredential,
        startUrl,
      };
      const profile: MappedProfile = {
        ...testProfileV1,
        sso_start_url: 'mismatched-start-url',
      };

      const result = utils.isMatchingStartUrl(cred, profile);

      expect(result).toBe(false);
    });

    it('should not throw an error on being passed a null value for profile', () => {
      const cred: CachedCredential = testCredential;

      // @ts-expect-error
      const fn = () => utils.isMatchingStartUrl(cred, null);

      expect(fn).not.toThrow();
    });
  });

  describe('isExpired', () => {
    it('should return true when an expired date is being compared', () => {
      const expiresAt = '2020-01-01T00:00:00UTC';
      jest
        .spyOn(global.Date, 'now')
        .mockImplementation(() =>
          new Date('2020-02-01T01:00:00.000Z').valueOf()
        );

      const result = utils.isExpired(expiresAt);

      expect(result).toBe(true);
    });

    it('should return false when an unexpired date is being compared', () => {
      const expiresAt = '2020-01-01T00:00:00UTC';
      jest
        .spyOn(global.Date, 'now')
        .mockImplementation(() =>
          new Date('2019-01-01T01:00:00.000Z').valueOf()
        );

      const result = utils.isExpired(expiresAt);

      expect(result).toBe(false);
    });
  });

  describe('awsSsoLogin', () => {
    it('should invoke exec with the provided profileName', async () => {
      const profileName = 'test-profile';
      const exec = jest.spyOn(cp, 'exec');
      const expected = [`aws sso login --profile ${profileName}`];
      jest.spyOn(nodeUtil, 'promisify').mockImplementation(exec => exec);

      await utils.awsSsoLogin(profileName);

      expect(exec).toHaveBeenCalledWith(...expected);
    });

    it('should log failure when an error is thrown', async () => {
      const profileName = 'test-profile';
      const spy = jest.spyOn(logger, 'debug');
      jest.spyOn(nodeUtil, 'promisify').mockImplementation(() => {
        throw new Error();
      });
      const expected = expect.stringContaining('Failed to run');

      const fn = () => utils.awsSsoLogin(profileName);

      await expect(fn()).rejects.toThrow();
      expect(spy).toHaveBeenCalledWith(expected);
    });
  });
});
