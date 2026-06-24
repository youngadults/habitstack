/// <reference lib="webworker" />
/// <reference types="vite/client" />

// Service Worker for StackFlow PWA
// Caches app shell for offline use, with network-first strategy for data

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'stackflow-v1';
const STATIC_ASSETS = [
	'/',
	'/stacks',
	'/stats',
	'/achievements',
];

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(STATIC_ASSETS);
		})
	);
	self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames
					.filter((name) => name !== CACHE_NAME)
					.map((name) => caches.delete(name))
			);
		})
	);
	self.clients.claim();
});

// Fetch: network-first for navigation, cache-first for static assets
self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip non-GET requests
	if (request.method !== 'GET') return;

	// Skip Supabase API calls
	if (url.hostname.includes('supabase')) return;

	// For navigation requests (HTML pages), use network-first
	if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
		event.respondWith(
			fetch(request)
				.then((response) => {
					// Cache the response
					const clone = response.clone();
					caches.open(CACHE_NAME).then((cache) => {
						cache.put(request, clone);
					});
					return response;
				})
				.catch(() => {
					// Fallback to cache
					return caches.match(request).then((cached) => {
						return cached || caches.match('/');
					});
				})
		);
		return;
	}

	// For static assets (JS, CSS, images), use cache-first
	if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/)) {
		event.respondWith(
			caches.match(request).then((cached) => {
				if (cached) return cached;
				return fetch(request).then((response) => {
					const clone = response.clone();
					caches.open(CACHE_NAME).then((cache) => {
						cache.put(request, clone);
					});
					return response;
				});
			})
		);
		return;
	}

	// Default: network-first
	event.respondWith(
		fetch(request)
			.then((response) => {
				const clone = response.clone();
				caches.open(CACHE_NAME).then((cache) => {
					cache.put(request, clone);
				});
				return response;
			})
			.catch(() => {
				return caches.match(request);
			})
	);
});

self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});

export {};