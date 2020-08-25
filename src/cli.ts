import { Command } from 'commander';
import { run } from './sso-creds';
import { red, green, blue, white } from 'chalk';

const {
  version,
  name,
}: { version: string; name: string } = require('../package.json');

const program = new Command();
const LOG_PREFIX = `[${name}]:`;

program
  .version(version)
  .name('ssocreds')
  .option(
    '-p, --profile <profile>',
    'profile to use for obtaining sso credentials',
    'default'
  )
  .option('-d, --debug', 'enables verbose logging', false)
  .option(
    '-u, --use-proxy',
    'flag for the aws sdk to use HTTPS_PROXY found in env',
    false
  )
  .parse(process.argv);

const statusMsg = `${LOG_PREFIX} %s SSO credentials for profile ${
  program.profile as string
}`;

console.log(white(`${LOG_PREFIX} AWS SSO Creds Helper v${version}`));

export async function main(): Promise<void> {
  console.log(blue(statusMsg.replace('%s', 'Getting')));
  try {
    await run({ profileName: program.profile, proxyEnabled: program.useProxy });
    console.log(green(statusMsg.replace('%s', 'Successfully loaded')));
  } catch (e) {
    console.log(red(`${statusMsg.replace('%s', 'Failed to load')}`));
    console.log(red(`${LOG_PREFIX} ${(e as Error).message}`));
    throw e;
  }
}

void main();
