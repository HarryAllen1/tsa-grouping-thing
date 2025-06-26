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

	const themeProperties = [
		'--background',
		'--foreground',
		'--card',
		'--card-foreground',
		'--popover',
		'--popover-foreground',
		'--primary',
		'--primary-foreground',
		'--secondary',
		'--secondary-foreground',
		'--muted',
		'--muted-foreground',
		'--accent',
		'--accent-foreground',
		'--destructive',
		'--border',
		'--input',
		'--ring',
		'--chart-1',
		'--chart-2',
		'--chart-3',
		'--chart-4',
		'--chart-5',
		'--sidebar',
		'--sidebar-foreground',
		'--sidebar-primary',
		'--sidebar-primary-foreground',
		'--sidebar-accent',
		'--sidebar-accent-foreground',
		'--sidebar-border',
		'--sidebar-ring',
	];

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
			for (const prop of themeProperties) {
				document.body.style.setProperty(prop, getRandomTailwindColor());
			}
		} else {
			for (const prop of themeProperties)
				document.body.style.removeProperty(prop);
		}
	});
</script>

{@render children()}
