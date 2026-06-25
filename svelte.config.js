import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// E2E tests use adapter-node since adapter-vercel can't serve locally
const adapterName = process.env.ADAPTER === 'node' ? '@sveltejs/adapter-node' : '@sveltejs/adapter-vercel';
const adapter = (await import(adapterName)).default;

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapterName === '@sveltejs/adapter-vercel'
			? adapter({ runtime: 'nodejs22.x' })
			: adapter()
	}
};

export default config;