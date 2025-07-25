<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Drawer from '$lib/components/ui/drawer';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Popover from '$lib/components/ui/popover';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import Customizer from '$lib/Customizer.svelte';
	import { auth } from '$lib/firebase';
	import { profilePhoto, userDoc } from '$lib/stores';
	import BookOpenText from '@lucide/svelte/icons/book-open-text';
	import CalendarCheck from '@lucide/svelte/icons/calendar-check';
	import ChartBar from '@lucide/svelte/icons/chart-bar';
	import Check from '@lucide/svelte/icons/check';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import Download from '@lucide/svelte/icons/download';
	import LogOut from '@lucide/svelte/icons/log-out';
	import NotebookText from '@lucide/svelte/icons/notebook-text';
	import Paintbrush from '@lucide/svelte/icons/paintbrush';
	import Trophy from '@lucide/svelte/icons/trophy';
	import UserPen from '@lucide/svelte/icons/user-pen';
	import Users from '@lucide/svelte/icons/users';
	import { setUser } from '@sentry/sveltekit';
	import { signOut } from 'firebase/auth';
	import { downloadAsCSV, downloadAsJSON } from './download';

	const navItems = [
		{
			title: 'Teams',
			href: '/',
			icon: Users,
		},
		{
			title: 'Edit Events',
			href: '/events',
			icon: CalendarCheck,
		},
		{
			title: 'Stats',
			href: '/stats',
			icon: ChartBar,
		},
		{
			title: 'Results',
			href: '/results',
			icon: Trophy,
		},
	];
	const adminNavItems = [
		{
			title: 'Teams',
			href: '/admin',
			icon: Users,
		},
		{
			title: 'Submissions',
			href: '/admin/submissions',
			icon: NotebookText,
		},
		{
			title: 'Members',
			href: '/admin/members',
			icon: UserPen,
		},
		{
			title: 'Results',
			href: '/admin/results',
			icon: Trophy,
		},
		{
			title: 'Check-ins',
			href: '/admin/checkins',
			icon: Check,
		},
		{
			title: 'Event Logs',
			href: '/admin/logs',
			icon: ClipboardList,
		},
	];

	const sidebar = Sidebar.useSidebar();
</script>

<Sidebar.Root side="left" collapsible="icon">
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton>
					{#snippet child({ props })}
						<a
							href="/"
							{...props}
							onclick={() => {
								if (sidebar.isMobile) {
									sidebar.setOpenMobile(false);
								}
							}}
							class="flex flex-row justify-start gap-2"
						>
							<div
								class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
							>
								<enhanced:img
									src="$lib/favicon.png"
									alt="Logo"
									class="size-8 rounded-md"
								/>
							</div>
							<div class="flex items-center truncate font-bold">
								TSA Teaming
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.Menu>
				{#each navItems as item}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton>
							{#snippet child({ props })}
								<a
									href={item.href}
									onclick={() => {
										if (sidebar.isMobile) {
											sidebar.setOpenMobile(false);
										}
									}}
									{...props}
								>
									<item.icon />
									<span>
										{item.title}
									</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{/each}
			</Sidebar.Menu>
		</Sidebar.Group>

		{#if $userDoc?.admin}
			<Sidebar.Group>
				<Sidebar.GroupLabel>Admin</Sidebar.GroupLabel>
				<Sidebar.Menu>
					{#each adminNavItems as item}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								{#snippet child({ props })}
									<a
										href={item.href}
										onclick={() => {
											if (sidebar.isMobile) {
												sidebar.setOpenMobile(false);
											}
										}}
										{...props}
									>
										<item.icon />
										<span>
											{item.title}
										</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.Group>
		{/if}
	</Sidebar.Content>
	<Sidebar.Footer>
		<Sidebar.Menu>
			{#if $userDoc?.admin}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuButton {...props}>
								<Download />
								<span>Download</span>
							</Sidebar.MenuButton>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content
						side={sidebar.isMobile ? 'bottom' : 'right'}
						align="end"
						sideOffset={4}
					>
						<DropdownMenu.Item onclick={downloadAsJSON}>JSON</DropdownMenu.Item>
						<DropdownMenu.Item onclick={downloadAsCSV}>CSV</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
				<Sidebar.MenuButton>
					{#snippet child({ props })}
						<a
							target="_blank"
							href="https://docs.teaming.jhstsa.org/"
							{...props}
						>
							<BookOpenText />
							<span> Documentation </span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			{/if}
			<Sidebar.MenuItem>
				<Drawer.Root>
					<Drawer.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuButton {...props} class="flex md:hidden">
								<Paintbrush />

								<span>Customize</span>
							</Sidebar.MenuButton>
						{/snippet}
					</Drawer.Trigger>
					<Drawer.Content class="bg-white p-6 dark:bg-zinc-950">
						<Customizer />
					</Drawer.Content>
				</Drawer.Root>
				<Popover.Root>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuButton class="hidden md:flex" {...props}>
								<Paintbrush />

								<span> Customize </span>
							</Sidebar.MenuButton>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content
						side={sidebar.isMobile ? 'bottom' : 'right'}
						align="end"
						sideOffset={4}
						class="w-[340px]"
					>
						<Customizer />
					</Popover.Content>
				</Popover.Root>
			</Sidebar.MenuItem>
			<Sidebar.MenuItem>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuButton
								size="lg"
								class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								{...props}
							>
								<Avatar.Root class="size-8 rounded-lg">
									<Avatar.Image src={$profilePhoto} alt={$userDoc.name} />
									<Avatar.Fallback class="rounded-lg">
										{@const split = $userDoc?.name?.split(' ')}
										{#if split}
											{split[0].slice(0, 1)}{split[1]?.slice(0, 1)}
										{:else}
											{$userDoc?.email?.slice(0, 2)}
										{/if}
									</Avatar.Fallback>
								</Avatar.Root>
								<div class="grid flex-1 text-left text-sm leading-tight">
									<span class="truncate font-semibold">{$userDoc.name}</span>
									<span class="truncate text-xs">{$userDoc.email}</span>
								</div>
								<ChevronsUpDown class="ml-auto size-4" />
							</Sidebar.MenuButton>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content
						class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
						side={sidebar.isMobile ? 'bottom' : 'right'}
						align="end"
						sideOffset={4}
					>
						<DropdownMenu.Label class="text-lg">
							{$userDoc?.preferredFirstName || $userDoc?.firstName}
							{$userDoc?.lastName}
						</DropdownMenu.Label>
						<DropdownMenu.Label class="font-normal">
							{$userDoc?.email}
						</DropdownMenu.Label>
						<DropdownMenu.Label>
							National ID: {$userDoc?.nationalId ?? 'Unassigned'}
						</DropdownMenu.Label>
						<DropdownMenu.Label>
							WTSA ID: {$userDoc?.washingtonId ?? 'Unassigned'}
						</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a href="/account" {...props}>
									<UserPen class="mr-2 size-4" />
									<span>Personal Details</span>
								</a>
							{/snippet}
						</DropdownMenu.Item>

						<DropdownMenu.Item
							onclick={() => {
								signOut(auth);
								setUser(null);
							}}
						>
							<LogOut class="mr-2 size-4" />
							<span>Log out</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
