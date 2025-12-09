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
      "@blockchain-commons/dcbor": "BCDcbor",
      "@blockchain-commons/known-values": "BCKnownValues",
      "@blockchain-commons/tags": "BCTags",
    },
  },
});
