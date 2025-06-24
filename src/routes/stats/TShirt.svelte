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
			.map((u) => ({
				tShirtSize: u.tShirtSize?.replace(/[WM]\s/g, ''),
			}))
			.reduce(
				(acc, curr) =>
					curr.tShirtSize
						? acc.map((d) => {
								if (d.tShirtSize === curr.tShirtSize) {
									return {
										tShirtSize: d.tShirtSize,
										frequency: d.frequency + 1,
									};
								}
								return d;
							})
						: acc,
				['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((d) => ({
					tShirtSize: d,
					frequency: 0,
				})),
			)}
		y="tShirtSize"
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
