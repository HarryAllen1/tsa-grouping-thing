<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { eventsCollection } from '$lib/stores';
	import RefreshCw from 'lucide-svelte/icons/refresh-cw';
	import { hideEmpty } from './state';
	import SubmissionEvent from './SubmissionEvent.svelte';

	let count = $state(0);
</script>

<svelte:head>
	<title>Admin Submission Management — JHS TSA Teaming</title>
</svelte:head>

<div class="container pt-8">
	<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
		Submissions
	</h1>

	<Label class="my-2 flex items-center space-x-2">
		<Switch bind:checked={$hideEmpty} />
		<span>Hide teams without submissions</span>
	</Label>

	<Button
		variant="ghost"
		class="my-2"
		onclick={() => {
			count++;
		}}
	>
		<RefreshCw /> Refresh all
	</Button>

	{#key count}
		{#each $eventsCollection.filter((e) => !['*Rooming', '*Cardboard Boat'].includes(e.event)) as event (event.event)}
			<SubmissionEvent {event} />
		{:else}
			<p>Loading...</p>
		{/each}
	{/key}
</div>
