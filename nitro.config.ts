import { defineConfig } from "nitro";

// The root index.html belongs to the separate legacy Pages demo. Never let
// Nitro auto-detect it as the catch-all: API requests must reach TanStack too.
export default defineConfig({
  renderer: { handler: "./server/ssr.ts" },
});
