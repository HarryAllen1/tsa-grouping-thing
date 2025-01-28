<script lang="ts">
	import { allUsersCollection } from '$lib/stores';
	import { barX, plot } from '@observablehq/plot';

	let graph = $state<HTMLDivElement>();

	$effect(() => {
		if ($allUsersCollection.length > 0) {
			let firstChar = 'A'.codePointAt(0) ?? 0;
			const data = $allUsersCollection
				.filter((e) => e.events.length)
				.reduce(
					(acc, curr) =>
						curr.lastName
							? acc.map((d) => {
									if (d.name === curr.lastName?.toUpperCase().charAt(0)) {
										return { name: d.name, value: d.value + 1 };
									}
									return d;
								})
							: acc,
					Array.from({ length: 26 })
						.fill(null)
						.map(() => String.fromCodePoint(firstChar++))
						.map((d) => ({
							name: d,
							value: 0,
						})),
				);

			const plotEl = plot({
				grid: true,
				x: {
					label: 'Frequency',
				},
				y: {
					label: 'First Letter of Last Name',
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
