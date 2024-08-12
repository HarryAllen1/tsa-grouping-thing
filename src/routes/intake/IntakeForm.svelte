<script lang="ts">
	import FormEvents from './FormEvents.svelte';
	import FormInfo from './FormInfo.svelte';

	let page = $state(1);
</script>

<div class="container mb-4">
	{#if page === 1}
		<FormInfo bind:page />
	{:else}
		<FormEvents bind:page />
	{/if}
</div>
