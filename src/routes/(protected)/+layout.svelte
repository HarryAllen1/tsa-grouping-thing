<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib';
	import { admins } from './admins';

	if (!admins.includes(auth.currentUser?.email?.toLowerCase() ?? '')) {
		goto('/');
	}
</script>

<slot />
