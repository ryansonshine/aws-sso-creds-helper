const mockVersion = jest.fn().mockReturnThis();
const mockName = jest.fn().mockReturnThis();
const mockOption = jest.fn().mockReturnThis();
const mockParse = jest.fn().mockReturnThis();

jest.mock('../../logger');
jest.mock('../../sso-creds');
jest.mock('commander', () => {
  return {
    Command: function () {
      return {
        version: mockVersion,
        name: mockName,
        option: mockOption,
        parse: mockParse,
      };
    },
  };
});

import commander, { Command } from 'commander';
import { main } from '../../cli';
import { logger } from '../../logger';
import { run } from '../../sso-creds';

const mockRun = run as jest.MockedFunction<typeof run>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('cli', () => {
  let program: commander.Command;

  beforeEach(() => {
    mockRun.mockReset();
    program = new Command();
  });

  it('should invoke the main function after program is finished', async () => {
    mockRun.mockResolvedValue();

    await main();

    expect(mockRun).toHaveBeenCalled();
    expect(mockVersion).toHaveBeenCalled();
    expect(mockName).toHaveBeenCalled();
    expect(mockOption).toHaveBeenCalled();
    expect(mockParse).toHaveBeenCalled();
    expect(program).toBeTruthy();
  });

  it('should log an error when run fails', async () => {
    mockRun.mockImplementation(() => {
      throw new Error();
    });

    await main();

    expect(mockRun).toHaveBeenCalled();
    expect(program).toBeTruthy();
  });

  it('should call logSysInfo when debug flag is set', async () => {
    mockLogger.isVerbose.mockReturnValue(true);

    await main();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockLogger.logSystemInfo).toHaveBeenCalled();
  });
});
