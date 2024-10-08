/// <reference types="@sveltejs/kit" />
/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// eslint-disable-next-line unicorn/prefer-global-this
const sw = self as unknown as ServiceWorkerGlobalScope;

import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ASSETS = [
	...build, // the app itself
	...files, // everything in `static`
];

/**
 * Create a new cache and add all files to it
 */
const addFilesToCache = async () => {
	const cache = await caches.open(CACHE);
	await cache.addAll(ASSETS);
};

sw.addEventListener('install', (event) => {
	event.waitUntil(addFilesToCache());
});

/**
 * Remove previous cached data from disk
 */
const deleteOldCaches = async () => {
	for (const key of await caches.keys()) {
		if (key !== CACHE) await caches.delete(key);
	}
};

sw.addEventListener('activate', (event) => {
	event.waitUntil(deleteOldCaches());
});

sw.addEventListener('fetch', (event) => {
	// ignore POST requests etc
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);

		// `build`/`files` can always be served from the cache
		if (ASSETS.includes(url.pathname)) {
			const response = await cache.match(url.pathname);

			if (response) {
				return response;
			}
		}

		// for everything else, try the network first, but
		// fall back to the cache if we're offline
		try {
			const response = await fetch(event.request);

			// if we're offline, fetch can return a value that is not a Response
			// instead of throwing - and we can't pass this non-Response to respondWith
			if (!(response instanceof Response)) {
				throw new TypeError('invalid response from fetch');
			}

			if (
				response.status === 200 &&
				new URL(response.url).protocol.startsWith('http')
			) {
				cache.put(event.request, response.clone());
			}

			return response;
		} catch (error) {
			const response = await cache.match(event.request);

			if (response) {
				return response;
			}

			// if there's no cache, then just error out
			// as there is nothing we can do to respond to this request
			throw error;
		}
	}

	event.respondWith(respond());
});
