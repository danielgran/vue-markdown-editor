import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import {
  mergeConfig, defineConfig,
} from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "happy-dom",
      include: ["src/**/*.test.ts"],
      root: fileURLToPath(new URL("./", import.meta.url)),
      coverage: {
        reporter: ["lcov"],
        reportsDirectory: resolve(__dirname, "coverage"),
        include: ["src/**/*.ts", "src/**/*.vue"],
        exclude: ["src/types"],
      },
    },
  }),
);
