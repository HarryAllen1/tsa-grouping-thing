import { sentrySvelteKit } from '@sentry/sveltekit';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sentrySvelteKit({
			sourceMapsUploadOptions: {
				org: 'harry-allen',
				project: 'tsa-grouping-thing',
			},
		}),
		enhancedImages(),
		sveltekit(),
	],
	build: {
		target: 'es2023',
		sourcemap: true,
	},
	optimizeDeps: {
		esbuildOptions: {
			target: 'es2023',
		},
	},
});
