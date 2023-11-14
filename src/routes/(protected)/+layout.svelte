<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, db, type UserDoc } from '$lib';
	import { docStore, userStore } from 'sveltefire';

	const user = userStore(auth);
	const userDoc = docStore<UserDoc>(db, `users/${$user?.email}`);

	$: if ($userDoc && !$userDoc?.admin) {
		goto('/');
	}
</script>

{#if $userDoc}
	<slot />
{/if}
