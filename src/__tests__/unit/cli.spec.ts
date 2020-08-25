const mockVersion = jest.fn().mockReturnThis();
const mockName = jest.fn().mockReturnThis();
const mockOption = jest.fn().mockReturnThis();
const mockParse = jest.fn().mockReturnThis();
const mockRed = jest.fn();
const mockGreen = jest.fn();

jest.mock('../../sso-creds');
jest.mock('chalk', () => {
  return {
    white: jest.fn(),
    blue: jest.fn(),
    green: mockGreen,
    red: mockRed,
  };
});
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

import * as ssoCreds from '../../sso-creds';
import commander, { Command } from 'commander';
import { main } from '../../cli';

const mockSsoCreds = ssoCreds as jest.Mocked<typeof ssoCreds>;

describe('cli', () => {
  let program: commander.Command;

  beforeEach(() => {
    mockSsoCreds.run.mockReset();
    program = new Command();
  });

  describe('statusMsg', () => {
    it('should invoke the main function after program is finished', () => {
      mockSsoCreds.run.mockResolvedValue();

      void main();

      expect(mockSsoCreds.run).toHaveBeenCalled();
      expect(mockVersion).toHaveBeenCalled();
      expect(mockName).toHaveBeenCalled();
      expect(mockOption).toHaveBeenCalled();
      expect(mockParse).toHaveBeenCalled();
      expect(mockGreen).toHaveBeenCalled();
      expect(program).toBeTruthy();
    });

    it('should log an error when run fails', () => {
      mockSsoCreds.run.mockImplementation(() => {
        throw new Error();
      });

      void main();

      expect(mockSsoCreds.run).toHaveBeenCalled();
      expect(mockRed).toHaveBeenCalled();
      expect(program).toBeTruthy();
    });
  });
});
