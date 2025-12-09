import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs", "iife"],
  dts: true,
  clean: true,
  treeshake: true,
  sourcemap: true,
  minify: false,
  target: "es2022",
  outDir: "dist",
  external: [],
  noExternal: [/@noble\/.*/],
  globalName: "BCCrypto",
});
