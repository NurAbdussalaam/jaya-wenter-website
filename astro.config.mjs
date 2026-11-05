import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://wenter.my.id",
  output: "static",
  trailingSlash: "ignore",
  build: { format: "directory" },
  publicDir: "./public",
});
