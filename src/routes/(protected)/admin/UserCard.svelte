<script lang="ts">
	import type { UserDoc } from '$lib';

	export let user: UserDoc;
</script>

<div class="space-y-1">
	<h4 class="text-md font-semibold">{user.name}</h4>
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
		<p>Events:</p>
		<div class="flex flex-col">
			{#each user.events as event}
				<a href="/admin?q={encodeURIComponent(event)}" class="underline">
					{event}
				</a>
			{/each}
		</div>
	</div>
</div>
