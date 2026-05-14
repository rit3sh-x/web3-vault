import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        nodePolyfills({
            include: ["buffer"],
            globals: { Buffer: true },
        }),
    ],
    resolve: {
        alias: {
            "@": path.resolve(root, "frontend"),
            "@contracts": path.resolve(root, "target/types"),
            "@idl": path.resolve(root, "target/idl"),
        },
    },
})
