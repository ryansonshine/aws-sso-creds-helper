import * as awsSdk from '../../aws-sdk';
import * as AWS from 'aws-sdk';
import { logger } from '../../logger';
import proxyAgent from 'proxy-agent';

describe('aws-sdk', () => {
  const PREV_ENV = process.env;

  beforeEach(() => {
    jest.restoreAllMocks();
    process.env = { ...PREV_ENV };
  });

  afterAll(() => {
    process.env = PREV_ENV;
  });

  describe('getSSOClient', () => {
    it('should return an instance of AWS.SSO', () => {
      const params: Parameters<typeof awsSdk.getSSOClient> = [
        'us-east-1',
        false,
      ];

      const result = awsSdk.getSSOClient(...params);

      expect(result).toBeInstanceOf(AWS.SSO);
    });

    it('should return not call config update when useProxy is false', () => {
      const update = jest.spyOn(AWS.config, 'update');
      const params: Parameters<typeof awsSdk.getSSOClient> = [
        'us-east-1',
        false,
      ];

      awsSdk.getSSOClient(...params);

      expect(update).not.toHaveBeenCalled();
    });

    it('should throw an error if attempting to use a proxy without proxy env vars', () => {
      const params: Parameters<typeof awsSdk.getSSOClient> = [
        'us-east-1',
        true,
      ];
      process.env.https_proxy = '';
      process.env.HTTPS_PROXY = '';

      const fn = () => awsSdk.getSSOClient(...params);

      expect(fn).toThrowError();
    });

    it('should update AWS config with proxy when useProxy is enabled and env vars are present', () => {
      const update = jest.spyOn(AWS.config, 'update');
      const proxy = 'http://localhost/test';
      const params: Parameters<typeof awsSdk.getSSOClient> = [
        'us-east-1',
        true,
      ];
      const expected: Parameters<typeof AWS.config.update> = [
        { httpOptions: { agent: proxyAgent(proxy) } },
      ];
      process.env.https_proxy = '';
      process.env.HTTPS_PROXY = proxy;

      awsSdk.getSSOClient(...params);

      expect(update).toHaveBeenCalledWith(...expected);
    });

    it('should log a message when a proxy is found in env vars but useProxy is false', () => {
      const logSpy = jest.spyOn(logger, 'debug');
      const proxy = 'http://localhost/test';
      const params: Parameters<typeof awsSdk.getSSOClient> = [
        'us-east-1',
        false,
      ];
      const expected = [
        expect.anything(),
        expect.anything(),
        expect.stringContaining('--use-proxy'),
      ];
      process.env.HTTPS_PROXY = proxy;

      awsSdk.getSSOClient(...params);

      expect(logSpy).toHaveBeenCalledWith(...expected);
    });
  });
});
