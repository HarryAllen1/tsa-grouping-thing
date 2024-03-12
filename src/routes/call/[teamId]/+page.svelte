<script lang="ts">
	import { page } from '$app/stores';
	import Videos from './Videos.svelte';
</script>

{#key $page.url.pathname}
	<Videos />
{/key}
