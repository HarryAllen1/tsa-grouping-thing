<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib';
	import { userStore } from 'sveltefire';
	import { admins } from './admins';

	const user = userStore(auth);

	if (!admins.includes($user?.email?.toLowerCase() ?? '')) {
		goto('/');
	}
</script>

<slot />
