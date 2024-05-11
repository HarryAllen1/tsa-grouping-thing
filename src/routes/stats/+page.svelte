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

	let graph = $state<HTMLDivElement>();

	$effect(() => {
		if ($allUsersCollection.length && $eventsCollection.length) {
			const events = $allUsersCollection
				.filter((u) => u.events)
				.reduce((acc, curr) => [...acc, ...curr.events], [] as string[])
				.reduce(
					(acc, curr) => {
						const index = acc.findIndex((e) => e.name === curr);
						if (index === -1) {
							return [...acc, { name: curr, freq: 1 }];
						} else {
							acc[index].freq++;
							return acc;
						}
					},
					[] as { name: string; freq: number }[],
				);
			$eventsCollection.forEach((e) => {
				const index = events.findIndex((event) => event.name === e.event);
				if (index === -1) {
					events.push({ name: e.event, freq: 0 });
				}
			});

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

				for (const label of labels) {
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
	<Grade />
</div>
