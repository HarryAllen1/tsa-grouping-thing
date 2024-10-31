<script lang="ts">
	import { auth, profilePhoto, userDoc } from '$lib';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import Customizer from '$lib/Customizer.svelte';
	import { signOut } from 'firebase/auth';
	import BookOpenText from 'lucide-svelte/icons/book-open-text';
	import CalendarCheck from 'lucide-svelte/icons/calendar-check';
	import ChartBar from 'lucide-svelte/icons/chart-bar';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import Download from 'lucide-svelte/icons/download';
	import ListCheck from 'lucide-svelte/icons/list-check';
	import LogOut from 'lucide-svelte/icons/log-out';
	import NotebookText from 'lucide-svelte/icons/notebook-text';
	import Paintbrush from 'lucide-svelte/icons/paintbrush';
	import UserCog from 'lucide-svelte/icons/user-cog';
	import UserPen from 'lucide-svelte/icons/user-pen';
	import Users from 'lucide-svelte/icons/users';
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
			icon: ListCheck,
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
			icon: ListCheck,
		},
		// {
		// 	title: 'Messages',
		// 	href: '/admin/messages',
		// },
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
									sidebar.setOpen(false);
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
											sidebar.setOpen(false);
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
												sidebar.setOpen(false);
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
				<Sidebar.MenuButton>
					{#snippet child({ props })}
						<a href="https://discord.gg/YyfNJWPmYD" target="_blank" {...props}>
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
							<span> Discord </span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
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
						class="w-[--bits-dropdown-menu-anchor-width] min-w-56 rounded-lg"
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
									<UserCog class="mr-2 h-4 w-4" />
									<span>Account Settings</span>
								</a>
							{/snippet}
						</DropdownMenu.Item>

						<DropdownMenu.Item
							onclick={() => {
								signOut(auth);
							}}
						>
							<LogOut class="mr-2 h-4 w-4" />
							<span>Log out</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
