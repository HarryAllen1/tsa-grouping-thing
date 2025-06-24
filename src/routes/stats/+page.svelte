<script lang="ts">
	import { MIN_EVENTS } from '$lib/constants';
	import { allUsersCollection, eventsCollection, userDoc } from '$lib/stores';
	import Demographics from './Demographics.svelte';
	import Events from './Events.svelte';
	import FirstLetter from './FirstLetter.svelte';
	import FirstLetterLast from './FirstLetterLast.svelte';
	import FoundBy from './FoundBy.svelte';
	import Gender from './Gender.svelte';
	import Grade from './Grade.svelte';
	import TShirt from './TShirt.svelte';

	let teamsWithPreparedness = $derived(
		$eventsCollection
			.flatMap((e) => e.teams)
			.filter((t) => t.preparationLevel !== undefined),
	);

	let totalTeams = $derived(
		$eventsCollection
			.filter((event) => !['*Rooming', '*Cardboard Boat'].includes(event.event))
			.flatMap((e) => e.teams).length,
	);
	let teamsWithRandomSwitch = $derived(
		$eventsCollection
			.filter((event) => !['*Rooming', '*Cardboard Boat'].includes(event.event))
			.flatMap((e) => e.teams)
			.filter((t) => t.random).length,
	);
</script>

<svelte:head>
	<title>Statistics — JHS TSA Teaming</title>
</svelte:head>

<div class="container mt-6">
	<p>
		Total members: {$allUsersCollection.filter(
			(u) => u.events.length > 0 && u.completedIntakeForm,
		).length}
	</p>
	{#if $userDoc.admin}
		<p>
			Members with at least {MIN_EVENTS} events: {$allUsersCollection.filter(
				(u) => u.events.length >= MIN_EVENTS && u.completedIntakeForm,
			).length}
		</p>
		<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
		{#each { length: MIN_EVENTS } as _, i}
			{@const num = MIN_EVENTS - i - 1}
			<p>
				Members with {num} events: {$allUsersCollection.filter(
					(u) => u.events.length === num && u.completedIntakeForm,
				).length}
			</p>
		{/each}

		<p>
			Events requiring eliminations: {$eventsCollection.reduce(
				(acc, e) =>
					e.teams.length > e.perChapter ||
					$allUsersCollection.filter((u) => u.events.includes(e.event)).length /
						e.maxTeamSize >
						e.perChapter
						? acc + 1
						: acc,
				0,
			)}
		</p>

		{#if teamsWithPreparedness.length > 0}
			<p>
				Teams who submitted their preparedness: {teamsWithPreparedness.length}
			</p>
			<p>
				Average preparedness: {Math.round(
					(teamsWithPreparedness.reduce(
						(acc, curr) => acc + Number(curr.preparationLevel),
						0,
					) /
						teamsWithPreparedness.length) *
						100,
				) / 100}
			</p>
		{/if}

		<p>
			Percent of teams with random switch: {Math.round(
				(teamsWithRandomSwitch / totalTeams) * 100,
			)}%
		</p>
	{/if}

	<Events />
	<Demographics />
	<Gender />
	<TShirt />
	<FirstLetter />
	<FirstLetterLast />
	<Grade />
	<FoundBy />
</div>
