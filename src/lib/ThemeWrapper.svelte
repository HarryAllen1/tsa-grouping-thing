<script lang="ts">
	import { config } from './config.js';

	export let defaultTheme: string | undefined = undefined;

	$: document.body.className = `theme-${$config.theme ?? defaultTheme}`;
	$: document.body.style.setProperty('--radius', `${$config.radius ?? 0.5}rem`);
	$: document.body.style.backgroundImage = `url(${$config.background ?? ''})`;
</script>

<slot />
