<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, db, type UserDoc } from '$lib';
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
