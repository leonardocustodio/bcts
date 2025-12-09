import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["iife", "cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2022",
  globalName: "BCEnvelope",
  outputOptions: {
    globals: {
      "@bcts/dcbor": "BCDcbor",
      "@bcts/known-values": "BCKnownValues",
      "@bcts/components": "BCComponents",
      "@bcts/uniform-resources": "BCUniformResources",
    },
  },
});
