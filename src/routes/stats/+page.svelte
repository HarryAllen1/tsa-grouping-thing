<script lang="ts">
	import { goto } from '$app/navigation';
	import { MIN_POINTS } from '$lib/constants';
	import { totalEventPoints } from '$lib/event-points';
	import { db } from '$lib/firebase';
	import { allUsersCollection, userDoc } from '$lib/stores';
	import type { EventDoc } from '$lib/types';
	import { barX, plot, rectY } from '@observablehq/plot';
	import { collectionStore } from 'sveltefire';
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
	let pointsGraph = $state<HTMLDivElement>();
	// Mirror the working event-sign-up page instead of relying on the shared
	// store, whose listener may not be initialized on this route.
	const events = collectionStore<EventDoc>(db, 'events');
	const userPoints = (eventNames: string[]) =>
		totalEventPoints(eventNames, $events);

	$effect(() => {
		if ($allUsersCollection.length > 0 && $events.length > 0) {
			const activeEvents = $events.filter(
				(event) => !['*Rooming', '*Cardboard Boat'].includes(event.event),
			);
			const activeEventNames = new Set(
				activeEvents.map((event) => event.event),
			);
			const eventCounts = $allUsersCollection
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
				)
				.filter((event) => activeEventNames.has(event.name));
			for (const e of activeEvents) {
				const index = eventCounts.findIndex((event) => event.name === e.event);
				if (index === -1) {
					eventCounts.push({ name: e.event, freq: 0 });
				}
			}

			eventCounts.sort((a, b) => b.freq - a.freq);

			const plotEl = plot({
				grid: true,
				x: {
					label: 'Frequency',
				},
				y: {
					label: 'Event name',
					domain: eventCounts.map((d) => d.name),
				},
				marks: [
					barX(eventCounts, {
						x: 'freq',
						y: 'name',
						fill(d: { name: string; freq: number }) {
							const error = eventError(
								d.name,
								$events,
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

	$effect(() => {
		if ($events.length === 0) return;

		const pointTotals = $allUsersCollection
			.filter((user) => user.completedIntakeForm)
			.map((user) => userPoints(user.events));
		const nonZeroPointTotals = pointTotals.filter((total) => total > 0);
		const maxPoints = Math.max(MIN_POINTS, ...nonZeroPointTotals, 1);
		const distribution = Array.from({ length: maxPoints }, (_, index) => {
			const points = index + 1;
			return {
				points,
				members: nonZeroPointTotals.filter((total) => total === points).length,
			};
		});

		const plotEl = plot({
			grid: true,
			x: {
				label: 'Total event points',
				domain: [0.5, maxPoints + 0.5],
				ticks: maxPoints,
			},
			y: {
				label: 'Members',
			},
			marks: [
				rectY(distribution, {
					x: 'points',
					interval: 1,
					y2: 'members',
					fill: 'var(--chart-1)',
					inset: 1,
					tip: true,
				}),
			],
		});
		plotEl.classList.add('bg-transparent!');
		pointsGraph?.replaceChildren(plotEl);
	});

	let teamsWithPreparedness = $derived(
		$events
			.flatMap((e) => e.teams)
			.filter((t) => t.preparationLevel !== undefined),
	);

	let totalTeams = $derived(
		$events
			.filter((event) => !['*Rooming', '*Cardboard Boat'].includes(event.event))
			.flatMap((e) => e.teams).length,
	);
	let teamsWithRandomSwitch = $derived(
		$events
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
		Total members with event points: {$allUsersCollection.filter(
			(u) => userPoints(u.events) > 0 && u.completedIntakeForm,
		).length}
	</p>
	{#if $userDoc.admin}
		<p>
			Members with at least {MIN_POINTS} event points: {$allUsersCollection.filter(
				(u) => userPoints(u.events) >= MIN_POINTS && u.completedIntakeForm,
			).length}
		</p>
		<p>
			Members below {MIN_POINTS} event points: {$allUsersCollection.filter(
				(u) => userPoints(u.events) < MIN_POINTS && u.completedIntakeForm,
			).length}
		</p>

		<p>
			Events requiring eliminations: {$events.reduce(
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

	<h2 class="mt-8 mb-3 text-xl font-semibold tracking-tight">
		Point distribution
	</h2>
	<div bind:this={pointsGraph}></div>

	<h2 class="mt-8 mb-3 text-xl font-semibold tracking-tight">
		Event distribution
	</h2>
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
