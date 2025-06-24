<script lang="ts">
	import * as Chart from '$lib/components/ui/chart';
	import { allUsersCollection } from '$lib/stores';
	import { BarChart } from 'layerchart';

	const chartConfig = {
		frequency: {
			label: 'Frequency',
			color: 'var(--chart-1)',
		},
	} satisfies Chart.ChartConfig;

	let firstChar = 'A'.codePointAt(0) ?? 0;
</script>

<Chart.Container config={chartConfig} class="container">
	<BarChart
		data={$allUsersCollection
			.filter((e) => e.events.length)
			.reduce(
				(acc, curr) =>
					curr.lastName
						? acc.map((d) => {
								if (d.firstLetter === curr.lastName?.toUpperCase().charAt(0)) {
									return {
										firstLetter: d.firstLetter,
										frequency: d.frequency + 1,
									};
								}
								return d;
							})
						: acc,
				Array.from({ length: 26 })
					.fill(null)
					.map(() => ({
						firstLetter: String.fromCodePoint(firstChar++),
						frequency: 0,
					})),
			)}
		y="firstLetter"
		x="frequency"
		legend
		orientation="horizontal"
		seriesLayout="group"
		series={[
			{
				key: 'frequency',
				label: chartConfig.frequency.label,
				color: chartConfig.frequency.color,
			},
		]}
	>
		{#snippet tooltip()}
			<Chart.Tooltip />
		{/snippet}
	</BarChart>
</Chart.Container>
