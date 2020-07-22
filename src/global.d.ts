import { Region } from './types';

declare namespace NodeJS {
  export interface ProcessEnv {
    /**
     * Test
     */
    AWS_DEFAULT_REGION: string;
  }
}
