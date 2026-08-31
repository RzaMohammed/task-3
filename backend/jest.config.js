module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/../tests'],
  testMatch: ['**/*.test.ts'],
  moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid')
  },
  verbose: true,
  forceExit: true,
  clearMocks: true,
  testTimeout: 45000
};
