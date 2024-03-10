import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		target: 'es2022',
	},
	optimizeDeps: {
		esbuildOptions: {
			target: 'es2022',
		},
		include: [
			'fuse.js',
			'shiki/bundle/web',
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
		],
	},
});
