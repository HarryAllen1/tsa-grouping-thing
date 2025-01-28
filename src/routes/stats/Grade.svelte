<script lang="ts">
	import { allUsersCollection } from '$lib/stores';
	import { barX, plot } from '@observablehq/plot';

	let graph = $state<HTMLDivElement>();

	$effect(() => {
		if ($allUsersCollection.length > 0) {
			const data = $allUsersCollection
				.filter((e) => e.events.length > 0 && e.grade)
				.reduce(
					(acc, curr) =>
						curr.grade
							? acc.map((d) => {
									if (d.name === curr.grade!) {
										return { name: d.name, value: d.value + 1 };
									}
									return d;
								})
							: acc,
					[9, 10, 11, 12].map((d) => ({
						name: d,
						value: 0,
					})) as {
						name: number;
						value: number;
					}[],
				);

			const plotEl = plot({
				grid: true,
				x: {
					label: 'Frequency',
				},
				y: {
					label: 'Grade',
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
