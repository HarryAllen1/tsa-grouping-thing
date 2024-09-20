<script lang="ts">
	import {
		db,
		eventsCollection,
		isMobileOrTablet,
		noHtmlMd,
		userDoc,
	} from '$lib';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import {
		Timestamp,
		addDoc,
		collection,
		doc,
		getDoc,
		setDoc,
	} from 'firebase/firestore';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
	import SendHorizontal from 'lucide-svelte/icons/send-horizontal';
	import { getContext, onMount } from 'svelte';
	import { selected } from './messages';

	let {
		teamId,
		hideBack = false,
	}: {
		teamId: string;
		hideBack?: boolean;
	} = $props();

	let messagesBox: HTMLDivElement;
	const isAdminMessages = getContext<boolean | undefined>('isAdminMessages');

	let team = $derived(
		$eventsCollection
			.flatMap((e) => e.teams.map((t) => ({ ...t, event: e })))
			.find((t) => t.id === teamId)!,
	);

	let newMessage = $state('');
	let apiKey = '';

	const scrollBoxToBottom = () => {
		messagesBox.scrollIntoView(false);
	};

	const sendMessage = async (event: SubmitEvent) => {
		event.preventDefault();
		if (newMessage.trim() === '') return;
		const teamsClone = structuredClone(team.event.teams);

		const foundTeam = teamsClone.find((t) => t.id === team.id);
		if (!foundTeam) return;

		let oldMessage = newMessage;

		foundTeam.messages ??= [];
		foundTeam?.messages?.push({
			content: newMessage,
			sender: {
				name: isAdminMessages
					? `(ADMIN) ${$userDoc?.name}`
					: ($userDoc?.name ?? ''),
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
		scrollBoxToBottom();

		moderateMessage(oldMessage);
	};

	const moderateMessage = async (message: string) => {
		const res = await fetch('https://api.openai.com/v1/moderations', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				input: message,
			}),
		});

		const moderation = await res.json();

		if (moderation.results[0].flagged) {
			const teamsClone = structuredClone(team.event.teams);

			const foundTeam = teamsClone.find((t) => t.id === team.id);
			if (!foundTeam) return;

			addDoc(collection(db, 'blockedMessages'), {
				teamId: team.id,
				teamNumber: team.teamNumber,
				event: team.event.event,
				content: message,
				sender: {
					name: $userDoc?.name ?? '',
					email: $userDoc?.email ?? '',
				},
				time: Timestamp.now(),
			});

			foundTeam.messages?.pop();

			await setDoc(
				doc(db, 'events', team.event.event),
				{
					teams: teamsClone,
				},
				{ merge: true },
			);
		}
	};

	// const sendNotification = (unreadMessages: Message[]) => {
	// 	if (unreadMessages?.length) {
	// 		const lastMessage = unreadMessages.at(-1);
	// 		const notification = new Notification(
	// 			`${team.teamName ?? team.event.event} team ${
	// 				team.teamNumber
	// 			} - ${lastMessage?.sender.name}`,
	// 			{
	// 				body: lastMessage?.content,
	// 				icon: '/favicon.png',
	// 			},
	// 		);

	// 		notification.addEventListener('click', () => {
	// 			$selected = team.id;
	// 			notification.close();
	// 		});
	// 	}
	// };

	onMount(async () => {
		apiKey = await getDoc(doc(db, 'settings', 'settings')).then(
			(d) => d.data()?.openAIAPIKey,
		);

		if (!isMobileOrTablet)
			document.querySelector<HTMLInputElement>('#newMessageInput')?.focus();

		if (
			!isAdminMessages &&
			team.messages?.filter(
				(m) => !m.readBy.some((r) => r.email === $userDoc?.email),
			).length
		) {
			for (const message of team.event.teams.find((t) => t.id === team.id)
				?.messages ?? []) {
				if (!message.readBy.some((r) => r.email === $userDoc?.email)) {
					message.readBy.push({
						name: $userDoc?.name ?? '',
						email: $userDoc?.email ?? '',
					});
				}
			}

			await setDoc(
				doc(db, 'events', team.event.event),
				{
					teams: team.event.teams,
				},
				{ merge: true },
			);
		}

		scrollBoxToBottom();
	});
</script>

<h3
	class="flex scroll-m-20 flex-row gap-2 text-2xl font-semibold tracking-tight"
>
	{#if !hideBack}
		<Button variant="ghost" size="icon" on:click={() => ($selected = null)}>
			<ChevronLeft />
		</Button>
	{/if}
	<span class="max-w-[15rem]">
		{team.teamName ??
			`${team.event.event.replaceAll('*', '').replaceAll(' (Washington Only)', '')} team ${team.teamNumber}`}
	</span>
	<div class="flex-1"></div>
</h3>

<ScrollArea id="messages" class="mb-4 h-80">
	<div class="flex h-full flex-1 flex-col" bind:this={messagesBox}>
		{#each team.messages ?? [] as message, i (i)}
			{@const timeSent = new Timestamp(
				message.time.seconds,
				message.time.nanoseconds,
			).toDate()}
			<div class="mt-4 flex space-x-2">
				<div class="flex flex-col">
					<p>
						<strong>{message.sender.name}</strong>
						<span class="opacity-80">
							{Date.now() - timeSent.getTime() < 1000 * 60 * 60 * 24
								? timeSent.toLocaleTimeString()
								: timeSent.toLocaleDateString()}
						</span>
					</p>
					<p class="prose dark:prose-invert">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html noHtmlMd.render(message.content)}
					</p>
				</div>
			</div>
		{:else}
			<p class="opacity-80 mt-8 w-full text-center">No messages!</p>
		{/each}
	</div>
</ScrollArea>

<form class="flex w-full flex-col gap-2" onsubmit={sendMessage}>
	<div class="flex items-center space-x-2">
		<Input
			type="text"
			autocomplete="off"
			id="newMessageInput"
			bind:value={newMessage}
			placeholder="Type a message"
		/>
		<Button type="submit" size="icon" class="aspect-square">
			<SendHorizontal />
		</Button>
	</div>
	<p class="text-sm text-muted-foreground">
		Board members and advisors can see all messages.
	</p>
</form>
