<script lang="ts">
	import { dev } from '$app/environment';
	import { goto, onNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		FancyConfirm,
		ProgressBar,
		analytics,
		auth,
		db,
		eventsCollection,
		storage,
		user,
		type UserDoc,
	} from '$lib';
	import ThemeCustomizer from '$lib/ThemeCustomizer.svelte';
	import ThemeWrapper from '$lib/ThemeWrapper.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import { Toaster } from '$lib/components/ui/sonner';
	import { onAuthStateChanged } from 'firebase/auth';
	import { doc, getDoc } from 'firebase/firestore';
	import MessageSquare from 'lucide-svelte/icons/message-square';
	import { ModeWatcher } from 'mode-watcher';
	import { onDestroy, onMount, type Snippet } from 'svelte';
	import { FirebaseApp, PageView, SignedIn, SignedOut } from 'sveltefire';
	import '../app.css';
	import Login from './Login.svelte';
	import MessagesPopover from './MessagesPopover.svelte';
	import Navbar from './Navbar.svelte';
	import { selected } from './messages';
	import { panelOpen } from './messages-panel';
	import { mouseThing } from './senuka-put-stuff-here';

	let {
		children,
	}: {
		children: Snippet;
	} = $props();

	const isAuthReady = auth.authStateReady();

	const unsub = onAuthStateChanged(auth, async (user) => {
		if (user && !user?.email?.endsWith('@lwsd.org') && !dev) {
			alert('You must use an LWSD account to log in.');
			await auth.currentUser?.delete();
		} else if (user) {
			const userDoc = await getDoc(
				doc(db, 'users', auth.currentUser?.email ?? ''),
			);
			const userData = userDoc.data() as UserDoc;
			if (!userData.completedIntakeForm) await goto('/intake');
		}
	});

	onNavigate(() => {
		$panelOpen = false;
	});

	let teams = $derived(
		($eventsCollection ?? [])
			.filter((e) =>
				e.teams.filter((t) =>
					t.members.find(
						(e) => e.email.toLowerCase() === $user.email?.toLowerCase(),
					),
				),
			)
			.flatMap((e) =>
				e.teams
					.filter((t) => t.members.find((m) => m.email === $user.email))
					.map((t) => ({ ...t, event: e })),
			) ?? [],
	);

	let unreadCount = $derived(
		teams.reduce(
			(acc, team) =>
				acc +
				(team.messages?.filter(
					(m) => !m.readBy.some((r) => r.email === $user.email),
				).length ?? 0),
			0,
		),
	);
	onMount(async () => {
		await auth.authStateReady();
		if (auth.currentUser) {
			const userDoc = await getDoc(
				doc(db, 'users', auth.currentUser?.email ?? ''),
			);
			const userData = userDoc.data() as UserDoc;
			if (!userData.completedIntakeForm) await goto('/intake');
		}
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

<ThemeWrapper>
	<ProgressBar class="text-primary" />
	<div class="flex max-w-full flex-col items-center">
		{#await isAuthReady then}
			<FirebaseApp {analytics} {auth} firestore={db} {storage}>
				{#if !dev}
					{#key $page.route.id}
						<PageView />
					{/key}
				{/if}
				<SignedIn>
					{#if $page.route.id !== '/intake'}
						<Navbar />
					{/if}
					{#key $user}
						{@render children()}
						{#if $page.route.id !== '/intake'}
							<div class="fixed bottom-8 right-8">
								<Popover.Root
									onOpenChange={(e) => {
										if (e) $selected = null;
									}}
									bind:open={$panelOpen}
								>
									<Popover.Trigger class="relative">
										<Button size="icon" class="size-16">
											<MessageSquare class="size-8" />
										</Button>
										{#if unreadCount}
											<div class="absolute -right-4 -top-4">
												<Badge variant="destructive">
													{unreadCount}
												</Badge>
											</div>
										{/if}
									</Popover.Trigger>
									<Popover.Content class="w-96 transition-all">
										<MessagesPopover />
									</Popover.Content>
								</Popover.Root>
							</div>
						{/if}
					{/key}
				</SignedIn>
				<SignedOut>
					<div class="mt-8 flex flex-col items-center gap-8">
						<ThemeCustomizer />
						<Login />
					</div>
				</SignedOut>
			</FirebaseApp>
		{/await}
	</div>

	<FancyConfirm />
	<Toaster />
</ThemeWrapper>
