/// <reference types="vitest" />
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss() as any,
		sveltekit()
	],
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node',
		globals: true
	}
});