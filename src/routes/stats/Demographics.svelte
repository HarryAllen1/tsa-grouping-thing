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
					curr.demographic
						? acc.map((d) => {
								if (d.demographic === curr.demographic) {
									return {
										demographic: d.demographic,
										frequency: d.frequency + 1,
									};
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
				].map((d) => ({ demographic: d, frequency: 0 })),
			)}
		y="demographic"
		x="frequency"
		orientation="horizontal"
		legend
		labels={{
			x: 'Frequency',
			y: 'Demographic',
		}}
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
