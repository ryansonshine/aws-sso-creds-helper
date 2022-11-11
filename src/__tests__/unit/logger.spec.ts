import {
  formatMessages,
  getCliConfig,
  getCliVersion,
  handleError,
  logger,
  logSysInfo,
  print,
  SEPARATOR,
} from '../../logger';
import { PrintArgs } from '../../types';
import * as nodeUtil from 'util';
import * as cp from 'child_process';

const logSpy = jest.spyOn(console, 'log');
const errorSpy = jest.spyOn(console, 'error');

jest.mock('util');
jest.mock('child_process');

describe('logger', () => {
  beforeEach(() => {
    logger.enable();
    logger.setVerbose(false);
    jest.clearAllMocks();
  });

  describe('formatMessages', () => {
    it('should return messages as a string', () => {
      const messages = ['test'];

      const result = formatMessages(messages);

      expect(typeof result).toBe('string');
    });

    it('should join messages with separator', () => {
      const messages = ['test', 'message'];
      const expected = messages.join(SEPARATOR);

      const result = formatMessages(messages);

      expect(result).toEqual(expected);
    });
  });

  describe('print', () => {
    const basePrintArgs: PrintArgs = {
      color: 'white',
      messages: ['test'],
      error: false,
    };

    it('should call console log when error is false', () => {
      const args: PrintArgs = {
        ...basePrintArgs,
      };

      print(args);
      logger.disable();

      expect(logSpy).toHaveBeenCalled();
    });

    it('should call console log when error is undefined', () => {
      const args: PrintArgs = {
        ...basePrintArgs,
        error: undefined,
      };

      print(args);

      expect(logSpy).toHaveBeenCalled();
    });

    it('should call console error when error is true', () => {
      const args: PrintArgs = {
        ...basePrintArgs,
        error: true,
      };

      print(args);

      expect(errorSpy).toHaveBeenCalled();
    });

    it('should not call console when logger is disabled', () => {
      const args: PrintArgs = {
        ...basePrintArgs,
      };

      logger.disable();
      print(args);

      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  describe('non-error non-debug log methods', () => {
    const methods: (keyof Pick<
      typeof logger,
      'success' | 'info' | 'warn' | 'log'
    >)[] = ['success', 'info', 'warn', 'log'];

    it('should log on each standard method', () => {
      expect.assertions(methods.length);

      methods.forEach((method, i) => {
        const msg = `test-${i}`;
        const expected = expect.stringContaining(msg);

        logger[method](msg);

        expect(logSpy).toHaveBeenCalledWith(expected);
      });
    });
  });

  describe('debug', () => {
    it('should log when verbose is true', () => {
      logger.setVerbose(true);
      logger.debug('test');

      expect(logSpy).toHaveBeenCalled();
    });

    it('should not log when verbose is false', () => {
      logger.debug('test');

      expect(logSpy).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should call console error', () => {
      logger.error('test');

      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('isVerbose', () => {
    it('should return true when verbose is set to true', () => {
      logger.setVerbose(true);

      const result = logger.isVerbose();

      expect(result).toEqual(true);
    });
  });

  describe('handleError', () => {
    const error = new Error('test error');
    it('should enable logger', () => {
      const spy = jest.spyOn(logger, 'enable');
      handleError(error);

      expect(spy).toHaveBeenCalled();
    });

    it('should log stack if stack is present and debug is true', () => {
      const spy = jest.spyOn(logger, 'log');
      handleError(error, true);

      expect(spy).toHaveBeenCalledWith(error.stack);
    });

    it('should log info message with debug details if debug is disabled', () => {
      const spy = jest.spyOn(logger, 'info');
      const expected = expect.stringContaining('--debug');

      handleError(error, false);

      expect(spy).toHaveBeenCalledWith(expected);
    });
  });

  describe('getCliVersion', () => {
    it('should replace newlines returned from exec output', async () => {
      const newLines = '\n\n';
      jest.spyOn(cp, 'exec').mockReturnValue({ stdout: newLines } as any);
      jest.spyOn(nodeUtil, 'promisify').mockImplementation(exec => exec);

      const result = await getCliVersion();

      expect(result).not.toContain(newLines);
    });

    it('should return NOT FOUND when exec throws an error', async () => {
      jest.spyOn(cp, 'exec').mockImplementation(() => {
        throw new Error();
      });
      jest.spyOn(nodeUtil, 'promisify').mockImplementation(exec => exec);

      const result = await getCliVersion();

      expect(result).toContain('NOT FOUND');
    });

    it('should return an empty string if no error is thrown and no stdout is returned', async () => {
      jest.spyOn(cp, 'exec').mockReturnValue({} as any);
      jest.spyOn(nodeUtil, 'promisify').mockImplementation(exec => exec);

      const result = await getCliVersion();

      expect(result).toEqual('');
    });
  });

  describe('getCliConfig', () => {
    it('should return the value returned from stdout with a leading newline', async () => {
      const expected = '\nstdout';
      jest.spyOn(cp, 'exec').mockReturnValue({ stdout: 'stdout' } as any);
      jest.spyOn(nodeUtil, 'promisify').mockImplementation(exec => exec);

      const result = await getCliConfig();
      console.log('result: ', result);

      expect(result).toEqual(expected);
    });

    it('should pass in the provided profile to exec', async () => {
      const profile = 'default';
      const exec = jest.spyOn(cp, 'exec');
      jest.spyOn(nodeUtil, 'promisify').mockImplementation(exec => exec);
      const expected = expect.stringContaining(profile);

      await getCliConfig(profile);

      expect(exec).toHaveBeenCalledWith(expected);
    });

    it('should return an empty string if no error is thrown and no stdout is returned', async () => {
      jest.spyOn(cp, 'exec').mockReturnValue({} as any);
      jest.spyOn(nodeUtil, 'promisify').mockImplementation(exec => exec);

      const result = await getCliConfig();

      expect(result).toEqual('\n');
    });

    it('should return NOT FOUND when exec throws an error', async () => {
      jest.spyOn(cp, 'exec').mockImplementation(() => {
        throw new Error();
      });
      jest.spyOn(nodeUtil, 'promisify').mockImplementation(exec => exec);

      const result = await getCliConfig('default');

      expect(result).toContain('NOT FOUND');
    });
  });

  describe('logSysInfo', () => {
    it('should invoke exec for version and config', async () => {
      const exec = jest.spyOn(cp, 'exec');
      jest.spyOn(nodeUtil, 'promisify').mockImplementation(exec => exec);

      await logSysInfo('default');

      expect(exec).toHaveBeenCalledTimes(2);
    });

    // it('should grab stdout from config', async () => {

    // });

    // it('should log not found messages on error', async () => {
    //   jest.spyOn(cp, 'exec').mockImplementation(() => {
    //     throw new Error();
    //   });
    //   jest.spyOn(nodeUtil, 'promisify').mockImplementation(exec => exec);

    //   const fn = async () => await logSysInfo('default');

    //   expect(fn).not.toThrow();
    // });
  });
});
