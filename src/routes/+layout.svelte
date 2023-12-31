<script lang="ts">
	import { dev } from '$app/environment';
	import { page } from '$app/stores';
	import {
		FancyConfirm,
		ProgressBar,
		analytics,
		auth,
		db,
		rtdb,
		storage,
		user,
	} from '$lib';
	import { LightSwitch } from '$lib/components/ui/light-switch';
	import { Toaster } from '$lib/components/ui/sonner';
	import { onAuthStateChanged } from 'firebase/auth';
	import { onMount } from 'svelte';
	import { FirebaseApp, PageView, SignedIn, SignedOut } from 'sveltefire';
	import '../app.css';
	import Login from './Login.svelte';
	import Navbar from './Navbar.svelte';

	const isAuthReady = auth.authStateReady();

	const unsub = onAuthStateChanged(auth, async (user) => {
		if (user && !user?.email?.endsWith('@lwsd.org')) {
			alert('You must use an LWSD account to log in.');
			await auth.currentUser?.delete();
		}
	});

	onMount(() => unsub);
</script>

<svelte:head>
	{#if !dev}
		<script
			async
			src="https://www.googletagmanager.com/gtag/js?id=G-V9TSZ35FNE"
		></script>
		<script>
			window.dataLayer = window.dataLayer || [];
			function gtag() {
				dataLayer.push(arguments);
			}
			gtag('js', new Date());

			gtag('config', 'G-V9TSZ35FNE');
		</script>
	{/if}
</svelte:head>

<ProgressBar class="text-blue-500" />
<div class="flex max-w-full flex-col items-center">
	{#await isAuthReady then}
		<FirebaseApp {rtdb} {analytics} {auth} firestore={db} {storage}>
			{#if !dev}
				{#key $page.route.id}
					<PageView />
				{/key}
			{/if}
			<SignedIn>
				<Navbar />
				{#key $user}
					<slot />
				{/key}
			</SignedIn>
			<SignedOut>
				<LightSwitch class="mt-4" />
				<Login />
			</SignedOut>
		</FirebaseApp>
	{/await}
</div>

<FancyConfirm />
<Toaster />
