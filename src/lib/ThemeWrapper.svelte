<script lang="ts">
	import { config } from './config.js';
	import { generateRandomHSLString } from './themes.js';

	export let defaultTheme: string | undefined = undefined;

	$: document.body.className = `theme-${$config.theme ?? defaultTheme}`;
	$: document.body.style.setProperty('--radius', `${$config.radius ?? 0.5}rem`);
	$: document.body.style.backgroundImage = `url(${$config.background ?? ''})`;
	$: if ($config.theme === 'random') {
		`--background
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
--ring`
			.split('\n')
			.forEach((prop) => {
				document.body.style.setProperty(
					prop,
					prop === '--ring'
						? Math.random().toString()
						: generateRandomHSLString(),
				);
			});
	} else {
		`--background
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
--ring`
			.split('\n')
			.forEach((prop) => document.body.style.removeProperty(prop));
	}
</script>

<slot />
