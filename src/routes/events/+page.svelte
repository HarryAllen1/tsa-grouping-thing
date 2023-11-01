<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, db, events } from '$lib';
	import { Button } from '$lib/components/button';
	import { Checkbox } from '$lib/components/checkbox';
	import { Label } from '$lib/components/label';
	import type { UserDoc } from '$lib/types';
	import { doc, setDoc } from 'firebase/firestore';
	import { Lock } from 'lucide-svelte';
	import { Doc, docStore, userStore } from 'sveltefire';

	const user = userStore(auth);

	if (!$user) goto('/login');

	const userDoc = docStore<UserDoc>(db, `users/${$user?.email}`);

	$: eventMap = events.reduce(
		(acc, curr) => ({
			...acc,
			[curr.event]: $userDoc?.events.includes(curr.event) ?? false,
		}),
		{} as { [event: string]: boolean },
	);
</script>

<Button href="/" class="mt-4">Go back to team creation page</Button>

<h1
	class="scroll-m-20 mt-4 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
>
	Changes will automatically be saved. Try to leave any teams for events you are
	dropping.
</h1>
<h1
	class="scroll-m-20 mt-4 mb-4 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
>
	Crossed out events are locked, likely due to eliminations.
</h1>
<p class="mb-2">Minimum 4 events, maximum 6 events.</p>
<p class="mb-4">Currently {$userDoc?.events.length}/6</p>
{#if ($userDoc?.events.length ?? 1) >= 6}
	<p class="mb-4">
		Remove one or more events if you want to change your events.
	</p>
{/if}

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
					checked={eventMap[event.event]}
					disabled={data.locked ||
						(!eventMap[event.event] && ($userDoc?.events.length ?? 0) >= 6) ||
						!$userDoc?.events}
					id={event.event}
					class="h-6 w-6 flex items-center justify-center [&>div]:w-6 [&>div]:h-6"
					onCheckedChange={async () => {
						if (
							data.locked ||
							(!eventMap[event.event] && ($userDoc?.events.length ?? 0) >= 6)
						)
							return;

						await setDoc(
							doc(db, 'users', $user?.email ?? ''),
							{
								events: eventMap[event.event]
									? $userDoc?.events.filter((e) => e !== event.event) ?? []
									: [...($userDoc?.events ?? []), event.event],
							},
							{
								merge: true,
							},
						);
					}}
				/>
				<Label
					for={event.event}
					class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 {data.locked ||
					(!eventMap[event.event] && ($userDoc?.events.length ?? 0) >= 6)
						? 'opacity-50'
						: ''} {data.locked ? 'line-through' : ''}"
				>
					<span class="ml-2">{event.event}</span>
				</Label>
				{#if data.locked}
					<Lock />
				{/if}
			</div>
		</Doc>
	{/each}
</div>