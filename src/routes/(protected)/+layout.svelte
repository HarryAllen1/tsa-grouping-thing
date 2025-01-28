<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, db } from '$lib/firebase';
	import type { UserDoc } from '$lib/types';
	import { docStore, userStore } from 'sveltefire';

	let { children } = $props();

	const user = userStore(auth);
	const userDoc = docStore<UserDoc>(db, `users/${$user?.email}`);

	$effect(() => {
		if ($userDoc && !$userDoc?.admin) {
			goto('/');
		}
	});
</script>

{#if $userDoc}
	{@render children()}
{/if}
