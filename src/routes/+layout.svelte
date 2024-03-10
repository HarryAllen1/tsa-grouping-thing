<script lang="ts">
	import { dev } from '$app/environment';
	import { page } from '$app/stores';
	import {
		FancyConfirm,
		ProgressBar,
		analytics,
		auth,
		db,
		storage,
		user,
	} from '$lib';
	import { Button } from '$lib/components/ui/button';
	import { LightSwitch } from '$lib/components/ui/light-switch';
	import * as Popover from '$lib/components/ui/popover';
	import { Toaster } from '$lib/components/ui/sonner';
	import { onAuthStateChanged } from 'firebase/auth';
	import MessageSquare from 'lucide-svelte/icons/message-square';
	import { onMount } from 'svelte';
	import { FirebaseApp, PageView, SignedIn, SignedOut } from 'sveltefire';
	import '../app.css';
	import Login from './Login.svelte';
	import MessagesPopover from './MessagesPopover.svelte';
	import Navbar from './Navbar.svelte';
	import { selected } from './messages';

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
		<FirebaseApp {analytics} {auth} firestore={db} {storage}>
			{#if !dev}
				{#key $page.route.id}
					<PageView />
				{/key}
			{/if}
			<SignedIn>
				<Navbar />
				{#key $user}
					<slot />
					<div class="fixed bottom-8 right-8">
						<Popover.Root
							onOpenChange={(e) => {
								if (e) $selected = null;
							}}
						>
							<Popover.Trigger>
								<Button size="icon" class="size-16">
									<MessageSquare class="size-8" />
								</Button>
							</Popover.Trigger>
							<Popover.Content class="transition-all">
								<MessagesPopover />
							</Popover.Content>
						</Popover.Root>
					</div>
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
