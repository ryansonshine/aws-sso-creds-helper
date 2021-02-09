import { Region } from './index';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /**
       * The default AWS region for the aws cli
       */
      AWS_DEFAULT_REGION?: Region;
      /**
       * An override for the stored credentials file
       */
      AWS_SHARED_CREDENTIALS_FILE?: string;
    }
  }
}
