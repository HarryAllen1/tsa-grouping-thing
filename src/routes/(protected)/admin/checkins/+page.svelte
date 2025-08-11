<script lang="ts">
	import { disableOnClick } from '$lib/better-utils';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { fancyConfirm } from '$lib/FancyConfirm.svelte';
	import { db } from '$lib/firebase';
	import { eventsCollection } from '$lib/stores';
	import type { EventDoc } from '$lib/types';
	import { collection, getDocs, updateDoc } from 'firebase/firestore';
	import CheckinEvent from './CheckinEvent.svelte';
	import { hideEmpty } from './state';

	let updater = $state(0);
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
	<Button
		variant="destructive"
		class="mt-2"
		{@attach disableOnClick(async () => {
			if (
				!(await fancyConfirm(
					'Are you sure you want to delete check ins for all teams for all events?',
					'This action is irreversible.',
				))
			) {
				return;
			}

			const events = await getDocs(collection(db, 'events'));

			for (const event of events.docs) {
				const data = event.data() as EventDoc;

				data.teams = data.teams.map((team) => {
					const {
						checkInComplete: _,
						checkInSubmittedBy: __,
						checkInSubmittedTime: ___,
						preparationLevel: ____,
						preparationLevelDescription: _____,
						...restTeam
					} = team;
					return restTeam;
				});

				await updateDoc(event.ref, { ...data });
			}

			updater++;
		})}
	>
		Delete all
	</Button>

	{#key updater}
		{#each $eventsCollection.filter((e) => !['*Rooming', '*Cardboard Boat'].includes(e.event)) as event (event.event)}
			<CheckinEvent {event} />
		{:else}
			<p>Loading...</p>
		{/each}
	{/key}
</div>
