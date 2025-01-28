<script lang="ts">
	import { eventsCollection } from '$lib/stores';
	import type { UserDoc } from '$lib/types';

	let {
		user,
	}: {
		user: UserDoc;
	} = $props();
</script>

{#each user.events as event}
	{@const maybeTeam = $eventsCollection
		.find((e) => e.event === event)
		?.teams.find((t) => t.members.find((m) => m.email === user.email))}
	<p class={[!maybeTeam && 'text-red-500']}>
		{event}

		{#if maybeTeam}
			({maybeTeam.teamNumber}{#if maybeTeam.teamCaptain?.toLowerCase() === user.email?.toLowerCase()}👑{/if})
		{/if}
	</p>
{/each}
