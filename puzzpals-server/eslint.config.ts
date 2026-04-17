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
