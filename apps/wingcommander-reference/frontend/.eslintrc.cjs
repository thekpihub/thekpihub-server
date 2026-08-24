module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh"],
  rules: {
    // Empty catch blocks are intentional in SSE/streaming error handling
    "no-empty": ["error", { "allowEmptyCatch": true }],
    // Fast-refresh only applies to dev; UI component files export variants alongside components
    "react-refresh/only-export-components": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "@typescript-eslint/no-empty-object-type": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    // react-hooks exhaustive-deps: warn only (initialisation effects are intentional)
    "react-hooks/exhaustive-deps": "warn",
  },
};
