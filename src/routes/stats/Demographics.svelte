<script lang="ts">
	import { allUsersCollection } from '$lib';
	import { barX, plot } from '@observablehq/plot';

	let graph: HTMLDivElement;

	$: if ($allUsersCollection.length) {
		const data = $allUsersCollection
			.filter((e) => e.events.length)
			.reduce(
				(acc, curr) =>
					curr.demographic
						? acc.map((d) => {
								if (d.name === curr.demographic) {
									return { name: d.name, value: d.value + 1 };
								}
								return d;
							})
						: acc,
				[
					'American Indian/Alaskan Native',
					'Asian/Asian-American/Pacific Islander',
					'Black/African-American',
					'Hispanic/Latino',
					'Mixed Race',
					'White/Caucasian',
					'Non-disclosed',
					'Opt-out',
				].map((d) => ({ name: d, value: 0 })) as {
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
				label: 'Demographic',
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
