<script lang="ts">
	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import FancyConfirm from '$lib/FancyConfirm.svelte';
	import ProgressBar from '$lib/ProgressBar.svelte';
	import ThemeWrapper from '$lib/ThemeWrapper.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Toaster } from '$lib/components/ui/sonner';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { analytics, auth, db, storage } from '$lib/firebase';
	import { user } from '$lib/stores';
	import type { UserDoc } from '$lib/types';
	import { setUser } from '@sentry/sveltekit';
	import { onAuthStateChanged } from 'firebase/auth';
	import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
	import { ModeWatcher } from 'mode-watcher';
	import { onDestroy, onMount, type Snippet } from 'svelte';
	import { FirebaseApp, PageView, SignedIn, SignedOut } from 'sveltefire';
	import '../app.css';
	import AppSidebar from './AppSidebar.svelte';
	import Login from './Login.svelte';
	import OfflineNotifier from './OfflineNotifier.svelte';
	import { mouseThing } from './senuka-put-stuff-here';
	import { config } from '$lib/config';

	navigator.vibrate ||= (pattern: number | number[]) => !!pattern;

	let {
		children,
	}: {
		children: Snippet;
	} = $props();

	if (($config.theme as string) === 'zinc') {
		$config.theme = 'default';
	}

	const isAuthReady = auth.authStateReady();

	const unsub = onAuthStateChanged(auth, async (user) => {
		if (user && !user?.email?.endsWith('@lwsd.org') && !dev) {
			setUser(null);
			alert('You must use an LWSD account to log in.');
			await auth.currentUser?.delete();
		} else if (
			user &&
			![
				's-hallen@lwsd.org',
				'1036145@lwsd.org',
				'1103909@lwsd.org',
				'harryall@uw.edu',
			].includes(user.email?.toLowerCase() ?? '')
		) {
			document.documentElement.innerHTML =
				'The teaming site has been disabled until the start of the 2025-2026 school year for maintenance work. If you need to access rubrics or other teaming information, please contact a board member.';
		} else if (user) {
			setUser(user as { email: string });
			let userDoc = await getDoc(
				doc(db, 'users', auth.currentUser?.email ?? ''),
			);
			if (!userDoc.exists()) {
				await setDoc(doc(db, 'users', auth.currentUser?.email ?? ''), {
					email: auth.currentUser?.email ?? '',
					name: auth.currentUser?.displayName ?? '',
					events: [],
					completedIntakeForm: false,
				} satisfies UserDoc);
				userDoc = await getDoc(doc(db, 'users', auth.currentUser?.email ?? ''));
			}
			const userData = userDoc.data() as UserDoc | undefined;
			if (userData) {
				if (!userData.events) {
					await updateDoc(doc(db, 'users', auth.currentUser?.email ?? ''), {
						events: [],
					});
				}
				if (!userData.completedIntakeForm) await goto('/intake');
			} else {
				await setDoc(doc(db, 'users', auth.currentUser?.email ?? ''), {
					email: auth.currentUser?.email ?? '',
					name: auth.currentUser?.displayName ?? '',
					events: [],
					completedIntakeForm: false,
				} satisfies UserDoc);
				await goto('/intake');
			}
		}
	});

	onMount(async () => {
		mouseThing();
	});

	onDestroy(unsub);
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

<ModeWatcher />

{#await isAuthReady then}
	<FirebaseApp {analytics} {auth} firestore={db} {storage}>
		<Sidebar.Provider>
			<Tooltip.Provider>
				<ThemeWrapper>
					<ProgressBar class="text-primary" />
					{#if page.route.id !== '/intake' && $user}
						<AppSidebar />
					{/if}
					<div class="w-full">
						{#if page.route.id !== '/intake' && $user}
							<div class="w-full p-4">
								<Sidebar.Trigger />
							</div>
						{/if}
						<div class="flex w-full flex-col items-center">
							{#if !dev}
								{#key page.route.id}
									<PageView />
								{/key}
							{/if}
							<SignedIn>
								{#key $user}
									{@render children()}
								{/key}
							</SignedIn>
							<SignedOut>
								{#if page.route.id === '/email-link'}
									{@render children()}
								{:else}
									<div class="mt-6">
										<Login />
									</div>
								{/if}
							</SignedOut>
						</div>
					</div>

					<FancyConfirm />
					<Toaster duration={2000} closeButton />
					<!-- must be after Toaster -->
					<OfflineNotifier />
				</ThemeWrapper>
			</Tooltip.Provider>
		</Sidebar.Provider>
	</FirebaseApp>
{/await}
