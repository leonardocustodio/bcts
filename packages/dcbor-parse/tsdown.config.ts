import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs", "iife"],
  dts: true,
  clean: true,
  treeshake: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  outDir: "dist",
  external: [
    "@bcts/dcbor",
    "@bcts/ur",
    "@bcts/known-values",
    "@bcts/tags",
  ],
});
