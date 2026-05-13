import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@contracts": path.resolve(root, "target/types"),
      "@idl": path.resolve(root, "target/idl"),
      "@": path.resolve(root, "frontend"),
    },
  },
  test: {
    include: ["tests/vault_*.ts"],
    testTimeout: 1_000_000,
    hookTimeout: 1_000_000,
    fileParallelism: false,
  },
});
