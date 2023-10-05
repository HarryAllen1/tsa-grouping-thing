<script lang="ts">
	import { userStore } from 'sveltefire';
	import { auth } from '$lib';
	import { goto } from '$app/navigation';
	import { admins } from '../admins';

	const user = userStore(auth);

	console.log($user);

	if (!$user || !admins.includes($user.email ?? '')) {
		goto('/');
	}
</script>
