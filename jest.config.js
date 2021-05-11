// jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  coverageReporters: ['text-summary', 'json-summary', 'lcov', 'clover'],
  collectCoverageFrom: ['services/**/*.js', 'actions/**/*.js'],
  coveragePathIgnorePatterns: ['node_modules'],
  testTimeout: 10000
}
