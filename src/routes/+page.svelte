<script lang="ts">
	import { auth } from '$lib';
	import { signOut } from 'firebase/auth';
	import Button from '../lib/components/button/button.svelte';
</script>

<Button on:click={() => signOut(auth)}>Sign out</Button>
