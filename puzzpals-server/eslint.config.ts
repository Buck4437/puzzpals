import nodeConfig from "eslint-plugin-n";
import { defineConfig } from "eslint/config";

import puzzpalsConfig from "../eslint.config.js";

export default defineConfig({
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  extends: [puzzpalsConfig, nodeConfig.configs["flat/recommended-module"]],
});
