module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    __DEV__: true,
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(svg|png|jpg|jpeg|gif)$': '<rootDir>/tests/mocks/fileMock.js',
    '^expo-local-authentication$': '<rootDir>/tests/mocks/expo-local-authentication.ts',
    '^expo-clipboard$': '<rootDir>/tests/mocks/expo-clipboard.ts',
    '^@noble/ciphers/aes$': '<rootDir>/node_modules/@noble/ciphers/aes.js',
    '^@noble/hashes/ripemd160$': '<rootDir>/node_modules/@noble/hashes/legacy.js',
    '^@noble/hashes/sha256$': '<rootDir>/node_modules/@noble/hashes/sha2.js',
    '^@noble/hashes/sha512$': '<rootDir>/node_modules/@noble/hashes/sha2.js',
    '^@noble/hashes/utils\\.js$': '<rootDir>/node_modules/@noble/hashes/utils.js',
    '^@noble/hashes/(.*)\\.js$': '<rootDir>/node_modules/@noble/hashes/$1.js',
    '^@noble/hashes/(.*)$': '<rootDir>/node_modules/@noble/hashes/$1.js',
  },
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }],
  },
  transformIgnorePatterns: [
    'node_modules[\\\\/](?!(?:@noble|ethers)[\\\\/])'
  ],
  testMatch: ['**/tests/**/*.test.ts'],
};
