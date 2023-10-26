<script lang="ts">
	import { auth, db, events } from '$lib';
	import { Button } from '$lib/components/button';
	import type { UserDoc } from '$lib/types';
	import { Collection, Doc, docStore, userStore } from 'sveltefire';
	import Checkbox from '../../lib/components/checkbox/checkbox.svelte';
	import Label from '../../lib/components/label/label.svelte';

	const user = userStore(auth);

	const userDoc = docStore<UserDoc>(db, `users/${$user?.email?.toLowerCase()}`);
</script>

<Button href="/" class="mt-4">Go back to team creation page</Button>

<h1
	class="scroll-m-20 mt-4 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
>
	Changes will automatically be saved. Try to leave any teams for events you are
	dropping.
</h1>
<div class="flex flex-col gap-2">
	{#each events as event}
		<Doc
			startWith={{
				teams: [
					{
						lastUpdatedBy: '',
						members: [{ email: '', name: '' }],
						teamCaptain: '',
					},
				],
				locked: false,
			}}
			ref="events/{event.event}"
			let:data
		>
			<div class="flex items-center space-x-2">
				<Checkbox
					id={event.event}
					class="h-6 w-6 flex items-center justify-center [&>div]:w-6 [&>div]:h-6"
					onCheckedChange={() => {}}
				/>
				<Label
					for={event.event}
					class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					<span class="ml-2">{event.event}</span>
				</Label>
			</div>
		</Doc>
	{/each}
</div>
