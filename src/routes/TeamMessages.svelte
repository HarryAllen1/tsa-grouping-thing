<script lang="ts">
	import { db, eventsCollection, userDoc } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Timestamp, doc, setDoc } from 'firebase/firestore';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import SendHorizontal from 'lucide-svelte/icons/send-horizontal';
	import { selected } from './messages';
	import { onMount } from 'svelte';

	export let teamId: string;

	$: team = $eventsCollection
		.flatMap((e) => e.teams.map((t) => ({ ...t, event: e })))
		.find((t) => t.id === teamId)!;

	let newMessage = '';

	onMount(() => {
		document.querySelector<HTMLInputElement>('#newMessageInput')?.focus();
		if (
			team.messages?.filter(
				(m) => !m.readBy.find((r) => r.email === $userDoc?.email),
			).length
		) {
			for (const message of team.event.teams.find((t) => t.id === team.id)
				?.messages ?? []) {
				if (!message.readBy.find((r) => r.email === $userDoc?.email)) {
					message.readBy.push({
						name: $userDoc?.name ?? '',
						email: $userDoc?.email ?? '',
					});
				}
			}

			setDoc(
				doc(db, 'events', team.event.event),
				{
					teams: team.event.teams,
				},
				{ merge: true },
			);
		}
	});
</script>

<h3 class="scroll-m-20 text-2xl font-semibold tracking-tight">
	<button on:click={() => ($selected = null)}>
		<ChevronLeft />
	</button>
	{team.teamName ??
		`${team.event.event.replaceAll('*', '').replaceAll(' (Washington Only)', '')} team ${team.teamNumber}`}
</h3>

<ScrollArea class="h-72">
	{#each team.messages ?? [] as message, i (i)}
		<div class="flex space-x-2">
			<div class="flex flex-col">
				<strong>{message.sender.name}</strong>
				<p>{message.content}</p>
			</div>
		</div>
	{/each}
</ScrollArea>

<form
	class="flex w-full items-center space-x-2"
	on:submit|preventDefault={async () => {
		if (newMessage.trim() === '') return;
		const teamsClone = structuredClone(team.event.teams);

		const foundTeam = teamsClone.find((t) => t.id === team.id);
		if (!foundTeam) return;

		foundTeam.messages ??= [];
		foundTeam?.messages?.push({
			content: newMessage,
			sender: {
				name: $userDoc?.name ?? '',
				email: $userDoc?.email ?? '',
			},
			id: crypto.randomUUID(),
			time: Timestamp.now(),
			readBy: [
				{
					name: $userDoc?.name ?? '',
					email: $userDoc?.email ?? '',
				},
			],
			reactions: [],
		});

		await setDoc(
			doc(db, 'events', team.event.event),
			{
				teams: teamsClone,
			},
			{ merge: true },
		);

		newMessage = '';
	}}
>
	<Input
		id="newMessageInput"
		bind:value={newMessage}
		placeholder="Type a message"
	/>
	<Button type="submit" size="icon" class="aspect-square">
		<SendHorizontal />
	</Button>
</form>
