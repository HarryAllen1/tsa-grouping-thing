<script lang="ts">
	import { page } from '$app/stores';
	import type { PageData } from './$types.js';
	import { rerender } from './rerender.js';
	import Videos from './Videos.svelte';

	let {
		data,
	}: {
		data: PageData;
	} = $props();
</script>

{#key ($page.url.pathname, $page.url.searchParams, $rerender)}
	<Videos {data} />
{/key}
