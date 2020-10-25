/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Command } from 'commander';
import { handleError, logger } from './logger';
import { run } from './sso-creds';

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
  logger.info(`Getting SSO credentials for profile ${profile}`);
  try {
    await run({ profileName: program.profile, proxyEnabled: program.useProxy });
    logger.success(
      `Successfully loaded SSO credentials for profile ${profile}`
    );
  } catch (e) {
    logger.error(`Failed to load SSO credentials for ${profile}`);
    handleError(e, logLevel);
  }
}

void main();
