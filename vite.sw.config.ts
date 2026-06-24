import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		lib: {
			entry: 'src/sw.ts',
			name: 'sw',
			formats: ['iife'],
			fileName: () => 'service-worker.js',
		},
		outDir: 'static',
		emptyOutDir: false,
	},
});