import { defineConfig } from "tsdown";

const common = {
  entry: ["src/index.ts"],
  outDir: "dist",
  inputOptions: {
    // The rolldown-plugin-dts "fake-js" pass transforms .d.ts content without
    // emitting a sourcemap, producing a spurious SOURCEMAP_BROKEN warning even
    // though the real JS sourcemaps are correct. Filter only that case.
    onwarn(warning: { code?: string }, defaultHandler: (warning: unknown) => void) {
      if (warning.code === "SOURCEMAP_BROKEN") return;
      defaultHandler(warning);
    },
  },
  sourcemap: true,
  target: "es2022",
} as const;

export default defineConfig([
  {
    ...common,
    format: ["cjs", "esm"],
    dts: true,
    clean: true,
    // `@blockchaincommons/dcbor` stays external: consumers must share one
    // canonical module instance (e.g. its global tags store).
  },
  {
    ...common,
    format: ["iife"],
    dts: false,
    clean: false,
    globalName: "bctsDcbor",
    deps: {
      // The browser/IIFE build must be self-contained, so the canonical
      // implementation is bundled here (and only here).
      alwaysBundle: ["@blockchaincommons/dcbor", "@blockchaincommons/dcbor/diagnostic"],
      onlyBundle: false,
    },
  },
]);
