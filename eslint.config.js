const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    // Browser scripts loaded with <script> tags (see src/index.html), sharing one global scope.
    files: ["src/**/*.js"],
    languageOptions: {
      sourceType: "script",
      globals: { ...globals.browser, module: "readonly" },
    },
  },
  {
    files: ["tests/**/*.js", "eslint.config.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
  },
];
