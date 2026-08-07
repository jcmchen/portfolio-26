import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    ".field-note-test-build/**",
    ".next/**",
    "next-env.d.ts",
    "out/**",
  ]),
]);

export default eslintConfig;
