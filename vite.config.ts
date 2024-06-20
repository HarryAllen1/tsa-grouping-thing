import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [enhancedImages(), sveltekit()],
	build: {
		target: 'es2022',
	},
	optimizeDeps: {
		esbuildOptions: {
			target: 'es2022',
		},
		include: [
			'fuse.js',
			'cmdk-sv',
			'tailwindcss/colors',
			'@observablehq/plot',
			'svelte-sonner',
			'@vercel/analytics',
			'sveltefire',
			'firebase/app',
			'firebase/auth',
			'firebase/firestore',
			'firebase/storage',
			'd3',
		],
	},
});
