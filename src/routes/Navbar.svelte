<script lang="ts">
	import { auth, db, profilePhoto, type UserDoc } from '$lib';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import * as Dropdown from '$lib/components/ui/dropdown-menu';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import ThemeCustomizer from '$lib/ThemeCustomizer.svelte';
	import { signOut } from 'firebase/auth';
	import BookOpenText from 'lucide-svelte/icons/book-open-text';
	import Clock from 'lucide-svelte/icons/clock';
	import Download from 'lucide-svelte/icons/download';
	import LogOut from 'lucide-svelte/icons/log-out';
	import UserCog from 'lucide-svelte/icons/user-cog';
	import { docStore, userStore } from 'sveltefire';
	import DesktopNav from './DesktopNav.svelte';
	import { downloadAsCSV, downloadAsJSON } from './download';
	import MobileNav from './MobileNav.svelte';

	const user = userStore(auth);
	const userDoc = docStore<UserDoc>(db, `users/${$user?.email}`);

	let navItems = $derived([
		{
			title: 'Teams',
			href: '/',
		},
		{
			title: 'Edit Events',
			href: '/events',
		},
		{
			title: 'Stats',
			href: '/stats',
		},
		{
			title: 'Results',
			href: '/results',
		},
		$userDoc?.admin
			? [
					{
						title: 'Admin Teams',
						href: '/admin',
					},
					{
						title: 'Admin Submissions',
						href: '/admin/submissions',
					},
					{
						title: 'Admin Members',
						href: '/admin/members',
					},
					{
						title: 'Admin Results',
						href: '/admin/results',
					},
					{
						title: 'Admin Messages',
						href: '/admin/messages',
					},
				]
			: [],
	]);
</script>

<header
	class="sticky top-0 z-40 w-full border-b bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
	<div class="container flex h-14 items-center">
		<DesktopNav {navItems} />
		<MobileNav {navItems} />
		<div
			class="flex flex-1 items-center justify-between space-x-2 sm:space-x-4 md:justify-end"
		>
			<div class="w-full flex-1 md:w-auto md:flex-none">
				<!-- Command Menu Here -->
			</div>
			<nav class="flex items-center space-x-2">
				<!-- profile -->
				{#if $userDoc?.admin}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							<Button size="icon" variant="ghost">
								<Download />
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content>
							<DropdownMenu.Item on:click={downloadAsJSON}>
								JSON
							</DropdownMenu.Item>
							<DropdownMenu.Item on:click={downloadAsCSV}>
								CSV
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
					<Button
						size="icon"
						target="_blank"
						variant="ghost"
						href="https://docs.teaming.jhstsa.org/"
					>
						<BookOpenText />
					</Button>
				{/if}
				<ThemeCustomizer />
				<Button
					size="icon"
					variant="ghost"
					href="https://discord.gg/YyfNJWPmYD"
					target="_blank"
					rel="noreferrer"
				>
					<svg
						role="img"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
						fill="currentColor"
						class="h-6 w-6"
					>
						<title>Discord</title>
						<path
							d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"
						/>
					</svg>
				</Button>
				<Dropdown.Root>
					<Dropdown.Trigger asChild let:builder>
						<Button builders={[builder]} size="icon" variant="ghost">
							<Avatar.Root>
								<Avatar.Image src={$profilePhoto} />
								<Avatar.Fallback>
									{@const split = $user?.displayName?.split(' ') ?? ''}
									{split[0].slice(0, 1)}{split[1]?.slice(0, 1)}
								</Avatar.Fallback>
							</Avatar.Root>
						</Button>
					</Dropdown.Trigger>
					<Dropdown.Content>
						<Dropdown.Label class="text-lg">
							{$userDoc?.preferredFirstName ?? $userDoc?.firstName}
							{$userDoc?.lastName}
						</Dropdown.Label>
						<Dropdown.Label class="font-normal">{$user?.email}</Dropdown.Label>
						{#if $userDoc?.nationalId}
							<Dropdown.Label>
								National ID: {$userDoc?.nationalId}
							</Dropdown.Label>
						{/if}
						{#if $userDoc?.washingtonId}
							<Dropdown.Label>
								WTSA ID: {$userDoc?.washingtonId}
							</Dropdown.Label>
						{/if}
						<Dropdown.Separator />
						<Dropdown.Item href="/account">
							<UserCog class="mr-2 h-4 w-4" />
							<span>Account Settings</span>
						</Dropdown.Item>
						<Dropdown.Item href="/changelog">
							<Clock class="mr-2 h-4 w-4" />
							<span>Changelog</span>
						</Dropdown.Item>
						<Dropdown.Item
							on:click={async () => {
								signOut(auth);
							}}
						>
							<LogOut class="mr-2 h-4 w-4" />
							<span>Log out</span>
						</Dropdown.Item>
					</Dropdown.Content>
				</Dropdown.Root>
			</nav>
		</div>
	</div>
</header>
