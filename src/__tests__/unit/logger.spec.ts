import { AwsCliUtilLogger } from 'aws-cli-util-logger';
import { logger } from '../../logger';

describe('logger', () => {
  it('should export an AwsCliUtilLogger', () => {
    expect(logger).toBeInstanceOf(AwsCliUtilLogger);
  });
});
