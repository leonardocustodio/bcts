import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["iife", "cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2022",
  globalName: "BCProvenanceMark",
  external: [/@noble\/.*/],
  outputOptions: {
    globals: {
      "@bcts/dcbor": "BCDcbor",
      "@bcts/rand": "BCRand",
      "@bcts/tags": "BCTags",
      "@bcts/uniform-resources": "BCUR",
      "@noble/hashes/sha2.js": "nobleHashesSha2",
      "@noble/hashes/hkdf.js": "nobleHashesHkdf",
      "@noble/ciphers/chacha.js": "nobleCiphersChacha",
    },
  },
});
