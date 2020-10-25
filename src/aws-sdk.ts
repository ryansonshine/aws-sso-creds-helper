import { Region } from './types';
import proxyAgent from 'proxy-agent';
import * as AWS from 'aws-sdk';
import { logger } from './logger';

export const getSSOClient = (region: Region, useProxy: boolean): AWS.SSO => {
  if (useProxy) {
    const proxy =
      process.env.https_proxy ||
      process.env.HTTPS_PROXY ||
      process.env.http_proxy ||
      process.env.HTTP_PROXY;
    if (!proxy) {
      throw new Error(
        'No proxy found in env, set HTTPS_PROXY or remove proxy flag and try again'
      );
    }
    logger.debug(`Proxy flag passed, setting proxy to ${proxy}`);
    AWS.config.update({
      httpOptions: {
        agent: proxyAgent(proxy),
      },
    });
  }
  if (
    !useProxy &&
    (process.env.HTTPS_PROXY ||
      process.env.https_proxy ||
      process.env.HTTP_PROXY ||
      process.env.http_proxy)
  ) {
    logger.debug(
      'Proxy found in environment variables without setting proxy flag',
      'if you are unable to pull sso credentials',
      'try running with the --use-proxy flag'
    );
  }
  logger.debug(`Initialized SSO service object with region ${region}`);
  return new AWS.SSO({ region });
};
