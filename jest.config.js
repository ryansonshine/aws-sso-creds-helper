module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.spec.ts'],
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
};
