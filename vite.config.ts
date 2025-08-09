import { defineConfig } from "vite";

export default defineConfig({
    server: {
        open: true,
        proxy: {
            "/api": {
                target: "http://localhost:3001",
                changeOrigin: true,
            },
            "/operations": {
                target: "http://localhost:3001",
                changeOrigin: true,
            },
            "/auth": {
                target: "http://localhost:3001",
                changeOrigin: true,
            },
        },
    },
});
