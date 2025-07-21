import { sentrySvelteKit } from '@sentry/sveltekit';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';

export default defineConfig({
	plugins: [
		devtoolsJson(),
		sentrySvelteKit({
			sourceMapsUploadOptions: {
				org: 'harry-allen',
				project: 'tsa-grouping-thing',
			},
		}),
		enhancedImages(),
		tailwindcss(),
		sveltekit(),
	],
	build: {
		target: 'es2023',
		sourcemap: true,
	},
});
