module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: './',
  testRegex: '.test.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@db/(.*)$': '<rootDir>/src/db/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@tools/(.*)$': '<rootDir>/src/tools/$1',
  },
};
