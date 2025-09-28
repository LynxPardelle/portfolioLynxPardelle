module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/unit/**/*.test.js',
    '**/tests/integration/**/*.test.js',
    '**/tests/regression/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  collectCoverageFrom: [
    'services/**/*.js',
    'controllers/**/*.js',
    'routes/**/*.js',
    'models/**/*.js',
    'app.js',
    'index.js',
    '!**/node_modules/**',
    '!**/*.config.js',
    '!**/coverage/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testTimeout: 30000,
  verbose: true,
  testEnvironmentOptions: {
    // Prevent Jest from using real AWS SDK
    NODE_ENV: 'test'
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1'
  }
};
