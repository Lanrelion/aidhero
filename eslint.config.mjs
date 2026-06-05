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
    // AidHero: exclude gstack skill files (not our code)
    ".agent/**",
    // Exclude generated/vendor files
    "node_modules/**",
    "scripts/generate-tts-audio.ts", // Build-time Node.js script — different lint rules apply
  ]),
]);

export default eslintConfig;
