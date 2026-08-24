import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The Express backend is a separate CommonJS project with its own tooling;
    // the frontend's Next/TS ESLint must not lint it.
    "backend/**",
    // Legacy reference material (pre-rebuild pages / design system), not shipped.
    "reference/**",
  ]),
]);

export default eslintConfig;
