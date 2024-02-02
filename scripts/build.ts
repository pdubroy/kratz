import type { BuildConfig } from "bun";

export const demoConfig: BuildConfig = {
  entrypoints: ["demo/app.ts"],
  minify: false,
  sourcemap: "external",
};

export const config: BuildConfig = {
  entrypoints: ["index.ts"],
  minify: true,
  sourcemap: "external",
};

Bun.build({
  ...config,
  outdir: "dist",
});
