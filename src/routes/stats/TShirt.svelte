<script lang="ts">
	import { allUsersCollection } from '$lib';
	import { barX, plot } from '@observablehq/plot';

	let graph = $state<HTMLDivElement>();

	$effect(() => {
		if ($allUsersCollection.length) {
			const data = $allUsersCollection
				.filter((e) => e.events.length)
				.reduce(
					(acc, curr): { name: string; value: number }[] =>
						curr.tShirtSize
							? acc.map((d) => {
									if (d.name === (curr.tShirtSize?.slice(2) ?? '')) {
										return { name: d.name, value: d.value + 1 };
									}
									return d;
								})
							: acc,
					['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((d) => ({
						name: d,
						value: 0,
					})) as {
						name: string;
						value: number;
					}[],
				);

			const plotEl = plot({
				grid: true,
				x: {
					label: 'Frequency',
				},
				y: {
					domain: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
					label: 'T-Shirt size',
				},
				color: {
					legend: true,
				},
				marks: [
					barX(data, {
						x: 'value',
						y: 'name',
						fill: 'var(--vp-c-text-1)',
						tip: true,
						marginLeft: 225,
						marginRight: 50,
					}),
				],
			});

			graph?.replaceChildren(plotEl);
		}
	});
</script>

<div bind:this={graph}></div>
