/* eslint-disable @typescript-eslint/no-empty-function */
import { CachedCredential } from '../types';
import * as utilsLib from '../utils';
import { isCredential, writeConfig, readConfig, isFile } from '../utils';
import fs from 'fs';

describe('utils', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('writeConfig', () => {
    it('should invoke writeFileSync with the provided filename and an encoded config from args', () => {
      const writeFileSync = jest.spyOn(fs, 'writeFileSync');
      const filename = '/tmp/filename';
      const config = {};
      const expected = [filename, '', expect.any(Object)];

      writeConfig<Record<string, unknown>>(filename, config);

      expect(writeFileSync).toHaveBeenCalledWith(...expected);
    });
  });

  describe('readConfig', () => {
    it('should invoke readFileSync with the provided filename', () => {
      const readFileSync = jest.spyOn(fs, 'readFileSync');
      const filename = '/tmp/filename';
      const expected = [filename];

      readConfig(filename);

      expect(readFileSync).toHaveBeenCalledWith(...expected);
    });
  });

  describe('isFile', () => {
    it('should invoke existsSync with the provided filename', () => {
      const existsSync = jest.spyOn(fs, 'existsSync');
      const filename = '/tmp/filename';
      const expected = [filename];

      isFile(filename);

      expect(existsSync).toHaveBeenCalledWith(...expected);
    });
  });

  describe('createBackup', () => {
    it('should not create a backup if no file exists', () => {});
    it('should create a .backup.firstrun if no backup has been made before', () => {});
    it('should create a .backup if a firstrun backup already exists', () => {});
  });

  describe('loadJson', () => {
    it('should return undefined if invalid json is found', () => {});
    it('should invoke readFileSync with the provided path', () => {});
  });

  describe('isMatchingStartUrl', () => {
    it('should return true on matching urls', () => {});
    it('should return false on un-matched urls', () => {});
    it('should not throw an error on being passed a null value for profile', () => {});
  });

  describe('isExpired', () => {
    it('should return true when an expired date is being compared', () => {});
    it('should return false when an unexpired date is being compared', () => {});
  });

  describe('isCredential', () => {
    it('should return true when a credential is passed', () => {
      const validCredential: CachedCredential = {
        accessToken: 'test',
        expiresAt: new Date().toISOString(),
        region: 'us-east-1',
        startUrl: 'test',
      };

      const result = isCredential(validCredential);

      expect(result).toBe(true);
    });

    it('should return false when an object without required props is passed', () => {
      const validCredential: CachedCredential = {
        accessToken: 'test',
        expiresAt: new Date().toISOString(),
        region: 'us-east-1',
        startUrl: 'test',
      };
      delete validCredential.accessToken;

      const result = isCredential(validCredential);

      expect(result).toBe(false);
    });
  });

  describe('awsSsoLogin', () => {
    it('should invoke exec with the provided profileName', async () => {});
  });

  describe('isExpiredCredsError', () => {
    it('should return true when passed an instance of ExpiredCredsError', () => {});
    it('should return false when passed a generic error', () => {});
  });
});
