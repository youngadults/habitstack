// Service Worker for StackFlow PWA
// Build output: static/service-worker.js
// This file is built separately by vite and placed in static/

/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;
declare const CACHE_NAME: string;

const CACHE = 'stackflow-v1';

const SHELL = [
	'/',
	'/stacks',
	'/stats',
	'/achievements',
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE).then((cache) => cache.addAll(SHELL))
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
		)
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	if (request.method !== 'GET') return;
	if (url.hostname.includes('supabase')) return;

	if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
		event.respondWith(
			fetch(request)
				.then((response) => {
					const clone = response.clone();
					caches.open(CACHE).then((cache) => cache.put(request, clone));
					return response;
				})
				.catch(() =>
					caches.match(request).then((cached) => cached ?? caches.match('/') as Promise<Response>)
				)
		);
		return;
	}

	if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/)) {
		event.respondWith(
			caches.match(request).then((cached) => {
				if (cached) return cached;
				return fetch(request).then((response) => {
					const clone = response.clone();
					caches.open(CACHE).then((cache) => cache.put(request, clone));
					return response;
				});
			})
		);
		return;
	}

	event.respondWith(
		fetch(request)
			.then((response) => {
				const clone = response.clone();
				caches.open(CACHE).then((cache) => cache.put(request, clone));
				return response;
			})
			.catch(() => caches.match(request) as Promise<Response>)
	);
});

self.addEventListener('message', (event) => {
	if (event.data?.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});

export {};