import {
  sharedIgnores,
  sharedRecommendedConfigs,
  sharedTypeScriptLanguageConfig,
  sharedVueLanguageConfig,
  sharedPlugins,
  sharedRules,
} from "./eslint/SharedRules.mjs";

export default [
  { ignores: sharedIgnores },
  ...sharedRecommendedConfigs,
  sharedTypeScriptLanguageConfig,
  sharedVueLanguageConfig,
  {
    files: ["**/*.ts", "**/*.vue"],
    plugins: sharedPlugins,
    rules: sharedRules,
  },
];
