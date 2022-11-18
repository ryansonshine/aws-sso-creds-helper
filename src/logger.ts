import { AwsCliUtilLogger } from 'aws-cli-util-logger';

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
export const name: string = require('../package.json').name;

const logger = new AwsCliUtilLogger({
  packageName: name,
  binCommand: 'ssocreds',
});

export { logger };
