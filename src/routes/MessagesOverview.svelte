<script lang="ts">
	import { eventsCollection, noHtmlMd, user } from '$lib';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { selected } from './messages';

	$: teams =
		$eventsCollection
			.filter((e) =>
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
			) ?? [];
</script>

<h2
	class="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
>
	Messages
</h2>

{#each teams as team, i (i)}
	<button
		class="relative flex w-full select-none rounded-sm px-2 py-1.5 text-start text-sm outline-none hover:bg-accent hover:text-accent-foreground"
		on:click={() => {
			$selected = team.id;
		}}
	>
		<div class="flex max-w-fit flex-col">
			<div class="flex flex-row">
				<strong>
					{team.teamName ??
						`${team.event.event.replaceAll('*', '').replaceAll(' (Washington Only)', '')} team ${team.teamNumber}`}
				</strong>
				{#if team.messages?.filter((m) => !m.readBy.find((r) => r.email === $user.email)).length}
					<div class="flex-1" />
					<Badge variant="destructive">
						{team.messages?.filter(
							(m) => !m.readBy.find((r) => r.email === $user.email),
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
{/each}
