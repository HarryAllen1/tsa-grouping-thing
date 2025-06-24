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
					curr.gender
						? acc.map((d) => {
								if (d.gender === curr.gender) {
									return {
										gender: d.gender,
										frequency: d.frequency + 1,
									};
								}
								return d;
							})
						: acc,
				['Female', 'Male', 'Non-Disclosed'].map((d) => ({
					gender: d,
					frequency: 0,
				})),
			)}
		y="gender"
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
