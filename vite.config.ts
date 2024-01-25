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
			'@zip.js/zip.js',
			'shiki',
			'cmdk-sv',
			'tailwindcss/colors',
			'@observablehq/plot',
			'lucide-svelte',
			'svelte-sonner',
			'@vercel/analytics',
			'sveltefire',
			'firebase/app',
			'firebase/firestore',
			'firebase/storage',
		],
	},
});
