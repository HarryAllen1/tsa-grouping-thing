<script lang="ts">
	import { page } from '$app/stores';
	import Videos from './Videos.svelte';

	export let data;
</script>

{#key ($page.url.pathname, $page.url.searchParams)}
	<Videos {data} />
{/key}
