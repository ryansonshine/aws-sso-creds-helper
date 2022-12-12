import {
  ExpiredCredsError,
  AwsSdkError,
  ProfileNotFoundError,
  InvalidProfile,
} from '../../errors';

describe('Errors', () => {
  describe('ExpiredCredsError', () => {
    it('should be an instanceof ExpiredCredsError', () => {
      const error = new ExpiredCredsError();

      expect(error).toBeInstanceOf(ExpiredCredsError);
    });

    it('should accept a custom message', () => {
      const msg = 'test message';
      const error = new ExpiredCredsError(msg);

      expect(error.message).toBe(msg);
    });

    it('should use a default message if none is provided', () => {
      const error = new ExpiredCredsError();

      expect(error.message).toBe(
        'Cached SSO login is expired/invalid, try running `aws sso login` and try again'
      );
    });
  });

  describe('AwsSdkError', () => {
    it('should be an instanceof AwsSdkError', () => {
      const error = new AwsSdkError();

      expect(error).toBeInstanceOf(AwsSdkError);
    });

    it('should accept a custom message', () => {
      const msg = 'test message';
      const error = new AwsSdkError(msg);

      expect(error.message).toBe(msg);
    });
  });

  describe('ProfileNotFoundError', () => {
    it('should be an instanceof ProfileNotFoundError', () => {
      const error = new ProfileNotFoundError('test');

      expect(error).toBeInstanceOf(ProfileNotFoundError);
    });
  });

  describe('InvalidProfile', () => {
    it('should be an instanceof InvalidProfile', () => {
      const error = new InvalidProfile('test');

      expect(error).toBeInstanceOf(InvalidProfile);
    });
  });
});
