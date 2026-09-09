const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

/**
 * Disable Metro's experimental "exports" map resolution.
 *
 * Metro 0.80+ enables package.json "exports" field resolution by default.
 * Several packages in this project (@noble/hashes, @noble/ciphers, ethers v6)
 * define "exports" maps that Metro cannot fully support, causing:
 *   - "Unable to resolve <subpath>" errors
 *   - "Failed to get SHA-1" errors when files resolved outside the watch map
 *
 * With this flag set to false, Metro falls back to the classic "main" field
 * resolution, which all these packages correctly declare.
 *
 * ethers v6:        "main": "./lib.commonjs/index.js"    ✓
 * @noble/hashes:   flat .js files at root                ✓
 * @noble/ciphers:  flat .js files at root                ✓
 */
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
