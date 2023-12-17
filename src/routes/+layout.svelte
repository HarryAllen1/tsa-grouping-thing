<script lang="ts">
	import { dev } from '$app/environment';
	import { page } from '$app/stores';
	import {
		FancyConfirm,
		ProgressBar,
		Toaster,
		auth,
		db,
		storage,
		user,
	} from '$lib';
	import { LightSwitch } from '$lib/components/ui/light-switch';
	import { onAuthStateChanged } from 'firebase/auth';
	import { onMount } from 'svelte';
	import { FirebaseApp } from 'sveltefire';
	import '../app.css';
	import Navbar from './Navbar.svelte';

	$: if (
		!$user &&
		$page.url.pathname !== '/login' &&
		$page.url.pathname !== '/stats'
	) {
		location.href = `/login`;
	}

	const unsub = onAuthStateChanged(auth, async (user) => {
		if (
			!user &&
			$page.url.pathname !== '/login' &&
			$page.url.pathname !== '/stats'
		) {
			location.href = `/login`;
		}
		if (user && !user?.email?.endsWith('@lwsd.org')) {
			alert('You must use an LWSD account to log in.');
			await auth.currentUser?.delete();
			location.href = '/login';
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
	<FirebaseApp {auth} firestore={db} {storage}>
		{#if $user}
			<Navbar />
		{:else}
			<LightSwitch class="mt-4" />
		{/if}
		<slot />
	</FirebaseApp>
</div>

<FancyConfirm />
<Toaster />
