<script lang="ts">
	import type { UserDoc } from '$lib';
	import { Button } from '$lib/components/ui/button';

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
			{#each user.events as event}
				<a href="/admin?q={encodeURIComponent(event)}" class="underline">
					{event}
				</a>
			{/each}
		</div>
	</div>
</div>
