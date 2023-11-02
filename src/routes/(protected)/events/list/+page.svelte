<script lang="ts">
	import type { UserDoc } from '$lib';
	import { db } from '$lib';
	import * as Accordion from '$lib/components/accordion';
	import { Button } from '$lib/components/button';
	import { collectionStore } from 'sveltefire';

	const usersDoc = collectionStore<UserDoc>(db, 'users');
</script>

<div class="mt-6">
	<Accordion.Root>
		{#each $usersDoc as userDoc}
			<Accordion.Item value={userDoc.email}>
				<Accordion.Trigger>
					{userDoc.name}
				</Accordion.Trigger>
				<Accordion.Content>
					<Button href="/events/{encodeURIComponent(userDoc.email)}"
						>Edit</Button
					>
					{#each userDoc.events as event}
						<p>{event}</p>
					{/each}
				</Accordion.Content>
			</Accordion.Item>
		{/each}
	</Accordion.Root>
</div>
