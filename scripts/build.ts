import type { BuildConfig } from "bun";

export const config: BuildConfig = {
  entrypoints: ["index.ts"],
  minify: true,
  sourcemap: "external",
};

Bun.build({
  ...config,
  outdir: "dist",
});
