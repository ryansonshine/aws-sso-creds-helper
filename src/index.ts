import { Command } from 'commander';
import { run } from './sso-creds';
import { red, green, blue } from 'chalk';

const { version, name } = require('../package.json');
const program = new Command();
const LOG_PREFIX = `[${name}]:`;

program
  .version(version)
  .name('ssocreds')
  .option('-p, --profile <profile>', 'profile to use for obtaining sso credentials', 'default')
  .option('-d, --debug', 'enables verbose logging', false)
  .parse(process.argv);

const statusMsg = `${LOG_PREFIX} %s SSO credentials for profile ${program.profile}`;

console.log(blue(statusMsg.replace('%s', 'Getting')));
run({ profileName: program.profile })
  .then(() => {
    console.log(green(statusMsg.replace('%s', 'Successfully loaded')));
  })
  .catch(e => {
    console.log(red(`${statusMsg.replace('%s', 'Failed to load')}`));
    console.log(red(`${LOG_PREFIX} ${e.message}`));
  });
