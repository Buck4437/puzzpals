import nodeConfig from "eslint-plugin-n";
import { defineConfig } from "eslint/config";
import pluginVitest from "@vitest/eslint-plugin";

import puzzpalsConfig from "../eslint.config.js";

export default defineConfig(
  puzzpalsConfig,
  nodeConfig.configs["flat/recommended-module"],
  {
    ...pluginVitest.configs.recommended,
    files: ["src/**/__tests__/*"],
    rules: {
      // The tests will check whether the type is correct
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
