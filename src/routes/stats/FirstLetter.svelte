<script lang="ts">
	import { allUsersCollection } from '$lib';
	import { barX, plot } from '@observablehq/plot';

	let graph: HTMLDivElement;

	$: if ($allUsersCollection.length) {
		let firstChar = 'A'.charCodeAt(0);
		const data = $allUsersCollection
			.filter((e) => e.events.length)
			.reduce(
				(acc, curr) =>
					curr.name
						? acc.map((d) => {
								if (d.name === curr.name.toUpperCase().charAt(0)) {
									return { name: d.name, value: d.value + 1 };
								}
								return d;
							})
						: acc,
				Array(26)
					.fill(null)
					.map(() => String.fromCharCode(firstChar++))
					.map((d) => ({
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
				label: 'First Letter of Name',
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
</script>

<div bind:this={graph} />
