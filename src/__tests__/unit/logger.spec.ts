import {
  formatMessages,
  handleError,
  logger,
  print,
  SEPARATOR,
} from '../../logger';
import { PrintArgs } from '../../types';

const logSpy = jest.spyOn(console, 'log');
const errorSpy = jest.spyOn(console, 'error');

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
});
