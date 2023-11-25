<script context="module" lang="ts">
	import { writable } from 'svelte/store';

	const urlStore = writable('');

	export const downloadURL = (url: string) => {
		urlStore.set(url);
	};
</script>

<!-- svelte-ignore a11y-missing-attribute -->
<iframe class="hidden" src={$urlStore} />
