import { Region } from './types';
import proxyAgent from 'proxy-agent';
import * as AWS from 'aws-sdk';

export const getSSOClient = (region: Region, useProxy: boolean): AWS.SSO => {
  if (useProxy) {
    const proxy = process.env.https_proxy || process.env.HTTPS_PROXY;
    if (!proxy) {
      throw new Error(
        'No proxy found in env, set HTTPS_PROXY or remove proxy flag and try again'
      );
    }
    AWS.config.update({
      httpOptions: {
        agent: proxyAgent(proxy),
      },
    });
  }
  return new AWS.SSO({ region });
};
