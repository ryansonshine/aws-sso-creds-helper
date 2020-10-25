import chalk from 'chalk';
import { PrintArgs } from './types';

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
export const name: string = require('../package.json').name;
export const LOG_PREFIX = `[${name}]:`;
export const SEPARATOR = ', ';

let verbose = false;
let disabled = false;

export const formatMessages = (messages: string[]): string =>
  messages.join(SEPARATOR);

export const print = ({ color, messages, error = false }: PrintArgs): void => {
  if (!disabled) {
    console[error ? 'error' : 'log'](
      `${chalk[color].bold(LOG_PREFIX, formatMessages(messages))}`
    );
  }
};

const success = (...messages: string[]): void =>
  print({ color: 'green', messages });

const info = (...messages: string[]): void =>
  print({ color: 'cyan', messages });

const warn = (...messages: string[]): void =>
  print({ color: 'yellow', messages });

const error = (...messages: string[]): void =>
  print({ color: 'red', messages, error: true });

const debug = (...messages: string[]): void => {
  if (verbose) {
    print({ color: 'gray', messages });
  }
};

const log = (...messages: string[]): void =>
  print({ color: 'white', messages });

const setVerbose = (level: boolean): void => {
  verbose = level;
  if (level) debug('====DEBUG====');
};

const isVerbose = (): boolean => verbose;

const disable = (): void => {
  disabled = true;
};

const enable = (): void => {
  disabled = false;
};

export const handleError = (e: Error, debug = false): void => {
  logger.enable();
  logger.error(e.message);
  if (e.stack && debug) {
    logger.log(e.stack);
  }
  if (!debug) {
    logger.info(
      chalk.dim(
        `Run ssocreds with ${chalk.dim('--debug')} flag for more details.`
      )
    );
  }
};

export const logger = {
  success,
  info,
  warn,
  error,
  debug,
  log,
  setVerbose,
  isVerbose,
  disable,
  enable,
};
