<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { eventsCollection } from '$lib/stores';
	import CheckinEvent from './CheckinEvent.svelte';
	import { hideEmpty } from './state';
</script>

<svelte:head>
	<title>Admin Check-in Management — JHS TSA Teaming</title>
</svelte:head>

<div class="container pt-8">
	<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
		Check-ins
	</h1>

	<Label class="my-2 flex items-center space-x-2">
		<Switch bind:checked={$hideEmpty} />
		<span>Hide teams without check-in</span>
	</Label>

	{#each $eventsCollection.filter((e) => !['*Rooming', '*Cardboard Boat'].includes(e.event)) as event (event.event)}
		<CheckinEvent {event} />
	{:else}
		<p>Loading...</p>
	{/each}
</div>
