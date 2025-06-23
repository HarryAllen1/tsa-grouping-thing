import { sentrySvelteKit } from '@sentry/sveltekit';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
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
		tailwindcss(),
		sveltekit(),
	],
	build: {
		target: 'es2024',
		sourcemap: true,
	},
	optimizeDeps: {
		esbuildOptions: {
			target: 'es2024',
		},
	},
});
