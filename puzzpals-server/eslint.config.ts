import nodeConfig from "eslint-plugin-n";
import { defineConfig } from "eslint/config";

import puzzpalsConfig from "../eslint.config.js";

export default defineConfig(
  puzzpalsConfig,
  nodeConfig.configs["flat/recommended-module"],
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
