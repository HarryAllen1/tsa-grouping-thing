<script lang="ts" setup>
	import { goto } from '$app/navigation';
	import { db, type EventDoc, type UserDoc } from '$lib';
	import { barX, plot } from '@observablehq/plot';
	import { collectionStore } from 'sveltefire';
	import colors from 'tailwindcss/colors';
	import { eventError } from '../eventError.js';
	import ColorKey from './ColorKey.svelte';
	import Button from '../../../../../lib/components/button/button.svelte';

	let graph: HTMLDivElement;
	const data = collectionStore<UserDoc>(db, 'users');
	const eventsCollection = collectionStore<EventDoc>(db, 'events');

	$: if ($data.length && $eventsCollection.length) {
		console.log($data, $eventsCollection);

		const events = $data
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
		const plotEl = plot({
			grid: true,
			marks: [
				barX(events, {
					x: 'freq',
					y: 'name',
					fill(d: { name: string; freq: number }, i) {
						const error = eventError(d.name, $eventsCollection, $data);
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
		const labels = plotEl.querySelectorAll<SVGElement>(
			'g[aria-label="y-axis tick label"] > text',
		);

		for (const label of labels) {
			label.style.textDecoration = 'underline';
			label.style.cursor = 'pointer';
			label.addEventListener('click', async () => {
				await goto(`/admin?q=${encodeURIComponent(label.textContent ?? '')}`);
			});
		}
		plotEl.classList.add('!bg-transparent');
		graph?.replaceChildren(plotEl);
	}
</script>

<div class="mt-6">
	<ColorKey />
	<div bind:this={graph} />
</div>
