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
</script>

<Chart.Container config={chartConfig} class="container">
	<BarChart
		data={$allUsersCollection
			.filter((e) => e.events.length)
			.reduce(
				(acc, curr) =>
					curr.foundBy
						? acc.map((d) => {
								if (d.foundBy === curr.foundBy) {
									return {
										foundBy: d.foundBy,
										frequency: d.frequency + 1,
									};
								}
								return d;
							})
						: acc,
				[
					'Friend/family',
					'Teacher',
					'JHS website club list',
					'Poster',
					'Social media',
					'Middle school',
					'Club fair',
					'Other',
				].map((d) => ({
					foundBy: d,
					frequency: 0,
				})),
			)}
		y="foundBy"
		x="frequency"
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
