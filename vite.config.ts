import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 5175,
        strictPort: false,
        host: true,
        hmr: {
            clientPort: 5175
        }
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',

        // Production optimizations
        target: 'es2022',
        minify: 'esbuild',
        cssMinify: true,

        // Code splitting for better caching
        rollupOptions: {
            output: {
                manualChunks: {
                    // Vendor chunk for dependencies
                    'vendor': ['hanzi-writer'],

                    // UI chunk for UI components
                    'ui': [
                        './src/ui/UIManager.ts',
                        './src/ui/HUDController.ts',
                        './src/ui/components/AvatarSelector.ts',
                        './src/ui/components/CardFactory.ts',
                        './src/ui/renderers/GameRenderer.ts',
                        './src/ui/renderers/LessonRenderer.ts',
                        './src/ui/renderers/StatsRenderer.ts',
                        './src/ui/renderers/DictationRenderer.ts'
                    ],

                    // Game logic chunk
                    'game': [
                        './src/game.ts',
                        './src/game/GameLogic.ts',
                        './src/game/DictationController.ts',
                        './src/game/XiziController.ts'
                    ]
                },

                // Consistent chunk naming for better caching
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
            }
        },

        // Performance settings
        reportCompressedSize: false,
        chunkSizeWarningLimit: 1000,

        // Source maps for production debugging (can be disabled)
        sourcemap: false
    },

    // Optimize dependencies
    optimizeDeps: {
        include: ['hanzi-writer'],
        exclude: []
    },

    // CSS code splitting
    css: {
        devSourcemap: true
    }
});
