<script lang="ts">
	import { eventsCollection } from '$lib/stores';
	import ResultCard from './ResultCard.svelte';
</script>

<svelte:head>
	<title>Results — JHS TSA Teaming</title>
</svelte:head>

<div class="container my-4">
	<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
		Elimination Results
	</h1>
	<p class="pb-2">
		Eliminations completed individually might be colored incorrectly.
	</p>

	<div
		class="grid w-full grid-cols-1 items-center gap-4 sm:grid-cols-2 lg:items-start xl:grid-cols-3"
	>
		{#each $eventsCollection
			.filter((e) => e.results?.length)
			.toSorted((a, b) => a.event.localeCompare(b.event)) as event}
			<ResultCard {event} />
		{:else}
			<p class="text-gray-500">No results posted yet</p>
		{/each}
	</div>
</div>
