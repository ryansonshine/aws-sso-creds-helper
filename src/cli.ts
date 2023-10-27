/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Command } from 'commander';
import { logger } from './logger';
import { run } from './sso-creds';

logger.warn('Notice: This package is no longer actively maintained.');
logger.warn(
  'This functionality is now supported by the AWS CLI. Please update to the\
 latest version and run "aws sso login --profile <profile_name>" to see if it works for your use case.'
);
logger.warn(
  'See https://docs.aws.amazon.com/cli/latest/userguide/sso-configure-profile-token.html for additional details.'
);

const version: string = require('../package.json').version;
const program = new Command();

program
  .version(version)
  .name('ssocreds')
  .option(
    '-p, --profile <profile>',
    'profile to use for obtaining sso credentials',
    'default'
  )
  .option('-d, --debug', 'enables verbose logging', false)
  .option('-v, --verbose', 'enables verbose logging', false)
  .option(
    '-u, --use-proxy',
    'flag for the aws sdk to use HTTPS_PROXY found in env',
    false
  )
  .parse(process.argv);

const profile = program.profile as string;
const logLevel = Boolean(program.debug || program.verbose);

logger.setVerbose(logLevel);
logger.log(`AWS SSO Creds Helper v${version}`);

export async function main(): Promise<void> {
  if (logger.isVerbose()) void (await logger.logSystemInfo(profile));
  logger.info(`Getting SSO credentials for profile ${profile}`);
  try {
    await run({ profileName: program.profile, proxyEnabled: program.useProxy });
    logger.success(
      `Successfully loaded SSO credentials for profile ${profile}`
    );
  } catch (e) {
    logger.error(`Failed to load SSO credentials for ${profile}`);
    logger.handleError(e, logLevel);
  }
}

void main();
