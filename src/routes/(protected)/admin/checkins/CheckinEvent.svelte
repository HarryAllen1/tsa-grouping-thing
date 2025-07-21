<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { db } from '$lib/firebase';
	import { user } from '$lib/stores';
	import type { EventDoc } from '$lib/types';
	import { doc, updateDoc } from 'firebase/firestore';
	import CheckinTeam from './CheckinTeam.svelte';

	let {
		event,
	}: {
		event: EventDoc;
	} = $props();
</script>

<div class="my-4">
	<h2
		class="mb-4 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
		id={event.event
			.toLowerCase()
			.replace(' (washington only)', '')
			.replaceAll(' ', '-')}
	>
		{event.event}
	</h2>
	<Label class="mb-4 flex flex-row items-center gap-2">
		<Switch
			onCheckedChange={async (checked) => {
				event.eventStatusCheckInEnabled = checked;
				await updateDoc(doc(db, 'events', event.event ?? ''), {
					eventStatusCheckInEnabled: checked,
					lastUpdatedBy: $user?.email ?? '',
				});
			}}
			checked={event.eventStatusCheckInEnabled}
		/>
		Enable event status check-in
	</Label>

	<div
		class="grid w-full grid-cols-1 items-center gap-4 sm:grid-cols-2 lg:items-start xl:grid-cols-3"
	>
		{#each event.teams as team (team.id)}
			<CheckinTeam {team} {event} />
		{:else}
			<p>No teams</p>
		{/each}
	</div>
</div>
