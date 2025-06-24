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
					curr.grade
						? acc.map((d) => {
								if (d.grade === curr.grade) {
									return {
										grade: d.grade,
										frequency: d.frequency + 1,
									};
								}
								return d;
							})
						: acc,
				[9, 10, 11, 12].map((d) => ({
					grade: d,
					frequency: 0,
				})),
			)}
		y="grade"
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
