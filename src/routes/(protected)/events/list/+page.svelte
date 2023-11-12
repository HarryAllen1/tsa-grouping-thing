<script lang="ts">
	import type { UserDoc } from '$lib';
	import { db } from '$lib';
	import * as Accordion from '$lib/components/ui/accordion';
	import { Button } from '$lib/components/ui/button';
	import { collectionStore } from 'sveltefire';

	const usersDoc = collectionStore<UserDoc>(db, 'users');
</script>

<div class="mt-6">
	<Accordion.Root>
		{#each $usersDoc as userDoc}
			<Accordion.Item value={userDoc.email}>
				<Accordion.Trigger>
					<span
						class:text-red-500={userDoc.events.length < 4 ||
							userDoc.events.length > 6}
					>
						{userDoc.name}
					</span>
				</Accordion.Trigger>
				<Accordion.Content>
					<Button href="/events/{encodeURIComponent(userDoc.email)}">
						Edit
					</Button>
					{#each userDoc.events as event}
						<p>{event}</p>
					{/each}
				</Accordion.Content>
			</Accordion.Item>
		{/each}
	</Accordion.Root>
</div>
