<script lang="ts">
	import type { Snippet } from 'svelte';
	import { config } from './config.js';
	import { getRandomTailwindColor } from './themes.js';

	let {
		children,
		defaultTheme,
	}: {
		children: Snippet;
		defaultTheme?: string;
	} = $props();

	$effect(() => {
		document.body.dataset.theme = $config.theme ?? defaultTheme;
		if ($config.theme === 'mono') {
			document.body.style.removeProperty('--radius');
		} else {
			document.body.style.setProperty(
				'--radius',
				`${$config.radius ?? 0.5}rem`,
			);
		}
		if (($config.background ?? '').length > 0) {
			document.body.style.backgroundImage = `url(${$config.background ?? ''})`;
		}
		if ($config.theme === 'random') {
			for (const prop of `--background
--foreground
--muted
--muted-foreground
--popover
--popover-foreground
--card
--card-foreground
--border
--input
--primary
--primary-foreground
--secondary
--secondary-foreground
--accent
--accent-foreground
--destructive
--destructive-foreground
--ring`.split('\n')) {
				document.body.style.setProperty(prop, getRandomTailwindColor());
			}
		} else {
			for (const prop of `--background
--foreground
--muted
--muted-foreground
--popover
--popover-foreground
--card
--card-foreground
--border
--input
--primary
--primary-foreground
--secondary
--secondary-foreground
--accent
--accent-foreground
--destructive
--destructive-foreground
--ring`.split('\n'))
				document.body.style.removeProperty(prop);
		}
	});
</script>

{@render children()}
