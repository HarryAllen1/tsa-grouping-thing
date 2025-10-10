<script lang="ts">
	import { goto } from '$app/navigation';
	import { MIN_EVENTS } from '$lib/constants';
	import { allUsersCollection, eventsCollection, userDoc } from '$lib/stores';
	import { barX, plot } from '@observablehq/plot';
	import colors from 'tailwindcss/colors';
	import ColorKey from './ColorKey.svelte';
	import Demographics from './Demographics.svelte';
	import { eventError } from './eventError.js';
	import FirstLetter from './FirstLetter.svelte';
	import FirstLetterLast from './FirstLetterLast.svelte';
	import FoundBy from './FoundBy.svelte';
	import Gender from './Gender.svelte';
	import Grade from './Grade.svelte';
	import TShirt from './TShirt.svelte';

	let graph = $state<HTMLDivElement>();

	$effect(() => {
		if ($allUsersCollection.length > 0 && $eventsCollection.length > 0) {
			const events = $allUsersCollection
				.filter((u) => u.events)
				.reduce((acc, curr) => {
					acc.push(...curr.events);
					return acc;
				}, [] as string[])
				.reduce(
					(acc, curr) => {
						const index = acc.findIndex((e) => e.name === curr);
						if (index === -1) {
							acc.push({ name: curr, freq: 1 });
							return acc;
						}
						acc[index].freq++;
						return acc;
					},
					[] as { name: string; freq: number }[],
				);
			for (const e of $eventsCollection.filter(
				(e) => !['*Rooming', '*Cardboard Boat'].includes(e.event),
			)) {
				const index = events.findIndex((event) => event.name === e.event);
				if (index === -1) {
					events.push({ name: e.event, freq: 0 });
				}
			}

			events.sort((a, b) => b.freq - a.freq);

			const plotEl = plot({
				grid: true,
				x: {
					label: 'Frequency',
				},
				y: {
					label: 'Event name',
					domain: events.map((d) => d.name),
				},
				marks: [
					barX(events, {
						x: 'freq',
						y: 'name',
						fill(d: { name: string; freq: number }) {
							const error = eventError(
								d.name,
								$eventsCollection,
								$allUsersCollection.filter((e) => e.events),
							);
							return error === 'errorNotEnough'
								? colors.blue[500]
								: error === 'errorTooMany'
									? colors.red[500]
									: error === 'warning'
										? colors.yellow[500]
										: 'var(--vp-c-text-1)';
						},
						tip: true,
						marginLeft: 225,
					}),
				],
			});
			if ($userDoc?.admin) {
				const labels = plotEl.querySelectorAll<SVGElement>(
					'g[aria-label="y-axis tick label"] > text',
				);

				for (const label of labels as unknown as Iterable<SVGElement>) {
					label.style.textDecoration = 'underline';
					label.style.cursor = 'pointer';
					label.addEventListener('click', async () => {
						await goto(
							`/admin?q=${encodeURIComponent(label.textContent ?? '')}`,
						);
					});
				}
			}

			plotEl.classList.add('bg-transparent!');
			graph?.replaceChildren(plotEl);
		}
	});

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

<div class="mt-6">
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

	<ColorKey />
	<div bind:this={graph}></div>

	<Demographics />
	<Gender />
	<TShirt />
	<FirstLetter />
	<FirstLetterLast />
	<Grade />
	<FoundBy />
</div>
