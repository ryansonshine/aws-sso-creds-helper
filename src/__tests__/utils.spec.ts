import { CachedCredential } from '../types';
import { isCredential } from '../utils';

describe('utils', () => {
  describe('isCredential', () => {
    it('should return true when a credential is passed', () => {
      // Arrange
      const validCredential: CachedCredential = {
        accessToken: 'test',
        expiresAt: new Date().toISOString(),
        region: 'us-east-1',
        startUrl: 'test',
      };

      // Act
      const result = isCredential(validCredential);

      // Assert
      expect(result).toBe(true);
    });
  });
});
