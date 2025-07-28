<script lang="ts">
	import { disableOnClick } from '$lib/better-utils';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { db } from '$lib/firebase';
	import { editCardboardBoatTeamName } from '$lib/functions';
	import { userDoc } from '$lib/stores';
	import type { EventDoc } from '$lib/types';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { doc, updateDoc } from 'firebase/firestore';

	let { teamId, event }: { teamId: string; event: EventDoc } = $props();

	let open = $state(false);
	let teamName = $state(
		event.teams.find((team) => team.id === teamId)?.teamName ?? '',
	);
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button variant="ghost" size="icon" {...props}>
				<Pencil />
			</Button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Title>Change Team Name</Dialog.Title>
		<Label for="teamName">Team Name</Label>
		<Input bind:value={teamName} />
		<Dialog.Footer>
			<Button variant="secondary" onclick={() => (open = false)}>Cancel</Button>
			<Button
				{@attach disableOnClick(async () => {
					if ($userDoc.admin) {
						const team = event.teams.find((team) => team.id === teamId);
						if (!team) return;
						team.teamName = teamName;
						await updateDoc(doc(db, `events/${event.event}`), {
							teams: event.teams,
						});
					} else {
						await editCardboardBoatTeamName({
							name: teamName,
							teamId: teamId,
						});
					}

					open = false;
				})}
			>
				Save
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
