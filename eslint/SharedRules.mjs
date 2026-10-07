/** Shared ESLint rule presets for @grandaniel projects. */

import stylistic from "@stylistic/eslint-plugin";
import importPlugin from "eslint-plugin-import-x";
import vuePlugin from "eslint-plugin-vue";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";

/** Stylistic options shared across projects. */
export const sharedStylisticOptions = {
  semi: true,
  indent: 2,
  quotes: "double",
  /** Delimiter style for interface/type members. Values: "none" | "semi" | "comma" */
  interfaceMemberDelimiter: "semi",
};

/** Rules for vue/recommended overrides. */
export const sharedVueRules = {
  "vue/singleline-html-element-content-newline": "off",
  "vue/html-self-closing": "off",
  "vue/multi-word-component-names": "off",
  "vue/no-multiple-template-root": "error",
  /** Rendering markdown to HTML is this library's purpose, so v-html is intentional. */
  "vue/no-v-html": "off",
};

/** Rules for stylistic overrides. */
export const sharedStylisticRules = {
  "@stylistic/arrow-parens": "off",
  "@stylistic/operator-linebreak": "off",
  "@stylistic/brace-style": "off",
  "@stylistic/indent-binary-ops": "off",
  "@stylistic/quote-props": "off",
  "@stylistic/max-len": [
    "warn",
    {
      code: 120,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
    },
  ],
  "@stylistic/object-curly-newline": [
    "error",
    {
      ImportDeclaration: {
        multiline: true,
        minProperties: 3,
        consistent: true,
      },
      ExportDeclaration: {
        multiline: true,
        minProperties: 3,
        consistent: true,
      },
    },
  ],
};

/** Rules for import ordering. */
export const sharedImportRules = {
  "import-x/order": ["error"],
};

/** Rules for TypeScript-specific checks that should be shared across projects. */
export const sharedTypeScriptRules = {
  "@typescript-eslint/no-explicit-any": "error",
};

/** Shared parser config for TypeScript files in flat config. */
export const sharedTypeScriptLanguageConfig = {
  files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
};

/** Shared parser config for Vue SFC files in flat config. */
export const sharedVueLanguageConfig = {
  files: ["**/*.vue"],
  languageOptions: {
    parser: vueParser,
    parserOptions: {
      parser: tseslint.parser,
      ecmaVersion: "latest",
      sourceType: "module",
      extraFileExtensions: [".vue"],
    },
  },
};

/** Shared plugin registration for flat config. */
export const sharedPlugins = {
  "@typescript-eslint": tseslint.plugin,
  "@stylistic": stylistic,
  "import-x": importPlugin,
  "vue": vuePlugin,
};

/** Global ignore patterns shared across projects (e.g. build output, coverage reports). */
export const sharedIgnores = ["coverage/**", "dist/**"];

/** All shared rules assembled for flat config usage. */
export const sharedRules = {
  ...sharedTypeScriptRules,
  ...sharedStylisticRules,
  ...sharedVueRules,
  ...sharedImportRules,
};

/**
 * Recommended rule sets of the plugins the shared rules build upon.
 * Must be spread before {@link sharedTypeScriptLanguageConfig} and
 * {@link sharedVueLanguageConfig}, which override the presets' parsers so
 * that `<script setup lang="ts">` blocks are parsed with the TypeScript parser.
 */
export const sharedRecommendedConfigs = [
  ...vuePlugin.configs["flat/recommended"],
  ...tseslint.configs.recommended,
  stylistic.configs.customize(sharedStylisticOptions),
];
