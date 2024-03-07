<script lang="ts">
	import { db, type EventDoc } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { doc, setDoc } from 'firebase/firestore';

	export let teamId: string;
	export let event: EventDoc;

	let open = false;
	let teamName = event.teams.find((team) => team.id === teamId)?.teamName;
</script>

<div class="flex w-full flex-row gap-2">
	<Dialog.Root bind:open>
		<Dialog.Trigger>
			<Button>Change Team Name</Button>
		</Dialog.Trigger>
		<Dialog.Content>
			<Dialog.Title>Change Team Name</Dialog.Title>
			<Label for="teamName">Team Name</Label>
			<Input bind:value={teamName} />
			<Dialog.Footer>
				<Button variant="secondary" on:click={() => (open = false)}>
					Cancel
				</Button>
				<Button
					on:click={async () => {
						const team = event.teams.find((team) => team.id === teamId);
						if (!team) return;
						team.teamName = teamName;
						await setDoc(
							doc(db, `events/${event.event}`),
							{
								teams: event.teams,
							},
							{ merge: true },
						);
						open = false;
					}}>Save</Button
				>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
</div>
