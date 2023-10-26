<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, db } from '$lib';
	import { Button } from '$lib/components/button';
	import { collection, getDocs } from 'firebase/firestore';
	import * as Accordion from '$lib/components/accordion';
	import { userStore } from 'sveltefire';
	import { admins } from '../../admins';

	const user = userStore(auth);

	if (!$user || !admins.includes($user.email?.toLowerCase() ?? '')) {
		goto('/');
	}

	const usersDoc = getDocs(collection(db, 'users'));
</script>

<Button href="/" class="mt-4">Go back to team creation page</Button>

{#await usersDoc then stuff}
	<Accordion.Root>
		{#each stuff.docs as userDoc}
			<Accordion.Item value={userDoc.id}>
				<Accordion.Trigger>
					{userDoc.id}
				</Accordion.Trigger>
				<Accordion.Content>
					<Button href="/events/{encodeURIComponent(userDoc.id)}">Edit</Button>
					{#each userDoc.data().events as event}
						<p>{event}</p>
					{/each}
				</Accordion.Content>
			</Accordion.Item>
		{/each}
	</Accordion.Root>
{/await}
