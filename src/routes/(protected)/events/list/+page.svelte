<script lang="ts">
	import { auth, db } from '$lib';
	import * as Accordion from '$lib/components/accordion';
	import { Button } from '$lib/components/button';
	import type { UserDoc } from '$lib/types';
	import { collectionStore, userStore } from 'sveltefire';

	const user = userStore(auth);

	const usersDoc = collectionStore<UserDoc>(db, 'users');
</script>

<Button href="/" class="mt-4">Go back to team creation page</Button>

<Accordion.Root>
	{#each $usersDoc as userDoc}
		<Accordion.Item value={userDoc.email}>
			<Accordion.Trigger>
				{userDoc.name}
			</Accordion.Trigger>
			<Accordion.Content>
				<Button href="/events/{encodeURIComponent(userDoc.email)}">Edit</Button>
				{#each userDoc.events as event}
					<p>{event}</p>
				{/each}
			</Accordion.Content>
		</Accordion.Item>
	{/each}
</Accordion.Root>
