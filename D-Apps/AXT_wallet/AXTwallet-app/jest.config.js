module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@noble/ciphers/aes$': '<rootDir>/node_modules/@noble/ciphers/aes.js',
    '^@noble/hashes/(.*)$': '<rootDir>/node_modules/@noble/hashes/$1.js',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }],
    '^.+\\.(js|jsx|mjs)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@noble|ethers)/)'
  ],
  testMatch: ['**/tests/**/*.test.ts'],
};
