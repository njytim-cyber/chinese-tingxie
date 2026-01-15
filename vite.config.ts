import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 5175,
        strictPort: false, // Allow fallback if 5175 is taken, but warn
        host: true,
        hmr: {
            // Ensure HMR knows we are on 5175 if it gets confused
            clientPort: 5175
        }
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets'
    }
});
