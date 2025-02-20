<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { eventsCollection } from '$lib/stores';
	import type { EventDoc, UserDoc } from '$lib/types';
	import ToggleRight from 'lucide-svelte/icons/toggle-right';

	let { user }: { user: UserDoc } = $props();
</script>

<div class="space-y-1">
	<h4 class="text-md font-semibold">{user.name}</h4>
	<div class="flex flex-row gap-2">
		<Button variant="outline" href="/events/{user.email}">Edit events</Button>
		<Button variant="outline" href="/account/{user.email}">Edit account</Button>
	</div>
	<div>
		<p>
			Grade: {user.grade}
		</p>
		<p>
			Email: <a href="mailto:{user.email}" class="underline">{user.email}</a>
		</p>
		<p>
			WA ID: {user.washingtonId}
		</p>
		<p>
			National ID: {user.nationalId}
		</p>
		{#if user.demographic}
			<p>
				Demographic: {user.demographic}
			</p>
		{/if}
		{#if user.gender}
			<p>
				Gender: {user.gender}
			</p>
		{/if}
		<p>Events ({user.events.length}):</p>
		<div class="flex flex-col">
			{#each user.events
				.map((event) => $eventsCollection.find((e) => e.event === event))
				.filter(Boolean) as EventDoc[] as event}
				{@const team = event.teams.find((team) =>
					team.members.some((t) => t.email === user.email),
				)}
				<a
					href="/admin?q={encodeURIComponent(event.event)}"
					class="flex flex-row underline"
				>
					{event.event}
					{#if team?.teamCaptain === user.email}
						(👑)
					{/if}
					{#if team?.random}
						<ToggleRight class="ml-2" />
					{/if}
				</a>
			{/each}
		</div>
	</div>
</div>
