<script lang="ts">
	import { auth, db } from '$lib/firebase';
	import type { UserDoc } from '$lib/types';
	import { docStore, userStore } from 'sveltefire';
	import UserDialog from './admin/UserDialog.svelte';

	let { children } = $props();

	const user = userStore(auth);
	const userDoc = docStore<UserDoc>(db, `users/${$user?.email}`);
</script>

{#if $userDoc}
	{@render children()}
{/if}

<UserDialog />
