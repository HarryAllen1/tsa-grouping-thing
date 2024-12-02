<script lang="ts">
	import { eventsCollection, noHtmlMd, user, userDoc } from '$lib';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { selected } from './messages';

	let teams = $derived(
		$eventsCollection
			.filter(
				(e) =>
					$userDoc?.events?.includes(e.event) &&
					e.maxTeamSize > 1 &&
					e.teams.filter((t) =>
						t.members.find(
							(e) => e.email.toLowerCase() === $user.email?.toLowerCase(),
						),
					),
			)
			.flatMap((e) =>
				e.teams
					.filter((t) => t.members.find((m) => m.email === $user.email))
					.map((t) => ({ ...t, event: e })),
			) ?? [],
	);
</script>

<h2
	class="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
>
	Messages
</h2>

{#each teams.toSorted((a, b) => {
	const aLastMessage = a.messages?.at(-1);
	const bLastMessage = b.messages?.at(-1);
	if (aLastMessage && bLastMessage) {
		return bLastMessage.time.seconds - aLastMessage.time.seconds;
	} else if (aLastMessage) {
		return -1;
	} else if (bLastMessage) {
		return 1;
	} else {
		return 0;
	}
}) as team, i (i)}
	<button
		class="hover:bg-accent hover:text-accent-foreground relative flex w-full rounded-sm px-2 py-1.5 text-start text-sm outline-hidden select-none"
		onclick={() => {
			$selected = team.id;
		}}
	>
		<div class="flex max-w-fit flex-col">
			<div class="flex flex-row">
				<strong>
					{team.teamName ??
						`${team.event.event.replaceAll('*', '').replaceAll(' (Washington Only)', '')} team ${team.teamNumber}`}
				</strong>
				{#if team.messages?.filter((m) => !m.readBy.some((r) => r.email === $user.email)).length}
					<div class="flex-1"></div>
					<Badge variant="destructive">
						{team.messages?.filter(
							(m) => !m.readBy.some((r) => r.email === $user.email),
						).length}
					</Badge>
				{/if}
			</div>
			<p
				class="block max-w-60 overflow-hidden text-ellipsis whitespace-nowrap opacity-80"
			>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html team.messages?.at(-1)
					? `${noHtmlMd.render(`${team.messages?.at(-1)?.sender.name}: ${team.messages?.at(-1)?.content}`)}`
					: 'No messages'}
			</p>
		</div>
	</button>
	{#if i < teams.length - 1}
		<Separator />
	{/if}
{:else}
	<p class="text-center">Join/create a team to access messages.</p>
{/each}
