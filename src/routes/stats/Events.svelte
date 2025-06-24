<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Chart from '$lib/components/ui/chart';
	import { allUsersCollection, eventsCollection, userDoc } from '$lib/stores';
	import { BarChart } from 'layerchart';
	import { eventError } from './eventError';

	const chartConfig = {
		frequency: {
			label: 'Frequency',
			color: 'var(--chart-1)',
		},
	} satisfies Chart.ChartConfig;

	let data = $derived(
		$allUsersCollection
			.filter((u) => u.events.length > 0)
			.reduce(
				(acc, curr) => {
					for (const event of curr.events) {
						const accEvent = acc.find((d) => d.name === event);
						if (accEvent) {
							accEvent.frequency++;
						}
					}

					return acc;
				},
				$eventsCollection
					.filter(
						(event) => !['*Cardboard Boat', '*Rooming'].includes(event.event),
					)
					.map((event) => ({
						...event,
						name: event.event,
						frequency: 0,
					})),
			),
	);
</script>

<Chart.Container config={chartConfig} class="container min-h-[1024px] ">
	<BarChart
		{data}
		y="name"
		x="frequency"
		c={(value) => {
			const error = eventError(
				value.name,
				$eventsCollection,
				$allUsersCollection.filter((e) => e.events.length > 0),
			);
			return error === 'errorNotEnough'
				? 'Not enough people'
				: error === 'errorTooMany'
					? 'Too many people'
					: error === 'warning'
						? 'Almost full'
						: 'Doing fine';
		}}
		cDomain={[
			'Doing fine',
			'Almost full',
			'Not enough people',
			'Too many people',
		]}
		cRange={[
			'var(--chart-1)',
			'var(--chart-3)',
			'var(--chart-4)',
			'var(--chart-5)',
		]}
		legend
		orientation="horizontal"
		onBarClick={$userDoc?.admin
			? (_, detail) => {
					goto(`/admin?q=${encodeURIComponent(detail.data.name ?? '')}`);
				}
			: undefined}
		tooltip={false}
	></BarChart>
</Chart.Container>
