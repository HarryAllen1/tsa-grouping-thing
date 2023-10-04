<script lang="ts">
	import { auth, db, events, memberData } from '$lib';
	import { signOut } from 'firebase/auth';
	import Button from '../lib/components/button/button.svelte';
	import { doc, setDoc } from 'firebase/firestore';

	const singedUpEvents = memberData
		.find((m) => m.email === auth.currentUser?.email)
		?.events.map((e) => ({
			...events.find((ev) => ev.event === e)
		}));

	for (const event of events) {
		setDoc(doc(db, 'events', event.event), []);
	}
</script>

<div class="mt-8 flex flex-col items-center">
	<Button on:click={() => signOut(auth)}>Sign out</Button>
</div>
