<script lang="ts">
	import { goto } from '$app/navigation';
	import { allUsersCollection, eventsCollection, userDoc } from '$lib';
	import { barX, plot } from '@observablehq/plot';
	import colors from 'tailwindcss/colors';
	import ColorKey from './ColorKey.svelte';
	import Demographics from './Demographics.svelte';
	import Gender from './Gender.svelte';
	import TShirt from './TShirt.svelte';
	import { eventError } from './eventError.js';
	import FirstLetter from './FirstLetter.svelte';
	import Grade from './Grade.svelte';
	import FirstLetterLast from './FirstLetterLast.svelte';

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

			const plotEl = plot({
				grid: true,
				x: {
					label: 'Frequency',
				},
				y: {
					label: 'Event name',
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

			plotEl.classList.add('!bg-transparent');
			graph?.replaceChildren(plotEl);
		}
	});
</script>

<div class="mt-6">
	<ColorKey />
	<div bind:this={graph}></div>

	<Demographics />
	<Gender />
	<TShirt />
	<FirstLetter />
	<FirstLetterLast />
	<Grade />
</div>
