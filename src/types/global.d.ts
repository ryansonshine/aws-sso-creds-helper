import { Region } from './index';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /**
       * The default AWS region for the aws cli
       */
      AWS_DEFAULT_REGION?: Region;
    }
  }
}
