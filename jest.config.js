module.exports = {
  testEnvironment: "jsdom",
  rootDir: './',
  moduleFileExtensions: ['ts', 'js'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    './jest.config.js'
  ],
  reporters: [
    'default'
  ],
  "watchPathIgnorePatterns": [
    "/node_modules/"
  ],
  setupFilesAfterEnv: ["<rootDir>/test/setup.tsx"],
  coverageReporters: ['lcov', 'text', 'text-summary'],
  preset: 'ts-jest',
};
