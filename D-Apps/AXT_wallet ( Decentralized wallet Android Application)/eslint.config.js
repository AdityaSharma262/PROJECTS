// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // @noble packages use package.json "exports" maps that the standard ESLint
    // import resolver cannot follow. Suppress false-positive unresolved errors.
    rules: {
      "import/no-unresolved": ["error", { ignore: ["^@noble/"] }],
    },
  },
]);
