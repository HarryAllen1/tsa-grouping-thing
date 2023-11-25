<script lang="ts">
	import { page } from '$app/stores';
	import { Download, FancyConfirm, auth, db, storage } from '$lib';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { LightSwitch } from '$lib/components/ui/light-switch';
	import { sleep } from '$lib/utils';
	import { onAuthStateChanged } from 'firebase/auth';
	import { onMount } from 'svelte';
	import { FirebaseApp, userStore } from 'sveltefire';
	import '../app.css';
	import Navbar from './Navbar.svelte';
	import { dev } from '$app/environment';

	const user = userStore(auth);

	let mainEl: HTMLDivElement;
	let captcha: HTMLDivElement;

	let dialogOpen = false;
	let clicksUntilCaptcha = 3;

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

	onMount(() => {
		if (
			$user?.email === 's-asli@lwsd.org' ||
			$user?.email === 's-sliyanage@lwsd.org'
		) {
			const listener = async () => {
				if (clicksUntilCaptcha > 0) {
					clicksUntilCaptcha--;
					return;
				}
				dialogOpen = true;
				await sleep(100);
				hcaptcha.render(captcha, {
					sitekey: 'e367d4e1-b6c8-4037-a17c-4b5f5d25141a',
					theme: document.documentElement.classList.contains('dark')
						? 'dark'
						: 'light',
					callback: () => {
						dialogOpen = false;
						clicksUntilCaptcha = 3;
					},
				});
			};
			mainEl.addEventListener('click', listener);
			mainEl.addEventListener('touchstart', listener);
		}

		return unsub;
	});
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

<div bind:this={mainEl} class="max-w-full flex flex-col items-center">
	<FirebaseApp {auth} firestore={db} {storage}>
		{#if $user}
			<Navbar />
		{:else}
			<LightSwitch class="mt-4" />
		{/if}
		<slot />
	</FirebaseApp>
</div>

<AlertDialog.Root bind:open={dialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Title>Captcha</AlertDialog.Title>
		<AlertDialog.Description>
			Please complete the captcha to continue.
			<div bind:this={captcha} />
		</AlertDialog.Description>
	</AlertDialog.Content>
</AlertDialog.Root>

<FancyConfirm />
<Download />
