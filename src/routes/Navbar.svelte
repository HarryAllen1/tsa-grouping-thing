<script lang="ts">
	import { auth, db, type Team } from '$lib';
	import * as Avatar from '$lib/components/avatar';
	import { Button } from '$lib/components/button';
	import * as Dropdown from '$lib/components/dropdown-menu';
	import LightSwitch from '$lib/components/light-switch/light-switch.svelte';
	import { Download, LogOut } from 'lucide-svelte';
	import { userStore } from 'sveltefire';
	import { admins } from './(protected)/admins';
	import DesktopNav from './DesktopNav.svelte';
	import MobileNav from './MobileNav.svelte';
	import { signOut } from 'firebase/auth';
	import { collection, getDocs } from 'firebase/firestore';

	const user = userStore(auth);

	const navItems: { title: string; href: string }[] = [
		{
			title: 'Teams',
			href: '/',
		},
		{
			title: 'Event signup',
			href: '/events',
		},
		...(admins.includes($user?.email?.toLowerCase() ?? '')
			? [
					{
						title: 'Admin',
						href: '/admin',
					},
					{
						title: 'Admin Events',
						href: '/events/list',
					},
					{
						title: 'Event Stats',
						href: '/admin/stats/events',
					},
			  ]
			: []),
	];
	const profilePhoto = fetch(
		'https://graph.microsoft.com/v1.0/me/photo/$value',
		{
			headers: {
				Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
				'Content-Type': 'image/webp',
			},
		},
	)
		.then((res) => res.blob())
		.then((blob) => URL.createObjectURL(blob));

	const downloadAsJSON = async () => {
		const teamsJSON = (await getDocs(collection(db, 'events'))).docs.map(
			(d) => ({
				event: d.id,
				...d.data(),
			}),
		);

		const teamsBlob = new Blob(
			[new TextEncoder().encode(JSON.stringify(teamsJSON, null, 2))],
			{
				type: 'application/json;charset=utf-8',
			},
		);

		const url = URL.createObjectURL(teamsBlob);
		const a = document.createElement('a');
		a.style.display = 'none';
		a.href = url;
		a.download = 'teams.json';
		document.body.append(a);
		a.click();
		URL.revokeObjectURL(url);
		a.remove();
	};
	const downloadAsCSV = async () => {
		const header = 'Event,Team Captain,Team Members\n';

		const teamsCSV = (await getDocs(collection(db, 'events'))).docs
			.map((d) => ({
				event: d.id,
				...(d.data() as { teams: Team[] }),
			}))
			.map((d) =>
				d.teams
					.map(
						(t) =>
							`"${d.event}","${t.teamCaptain ?? ''}","${t.members
								.map((m) => m.name)
								.join(';')}"`,
					)
					.join('\n'),
			)
			.join('\n')
			.replaceAll('\n\n', '\n');

		const teamsBlob = new Blob([new TextEncoder().encode(header + teamsCSV)], {
			type: 'text/csv;charset=utf-8',
		});

		const url = URL.createObjectURL(teamsBlob);
		const a = document.createElement('a');
		a.style.display = 'none';
		a.href = url;
		a.download = 'teams.csv';
		document.body.append(a);
		a.click();
		URL.revokeObjectURL(url);
		a.remove();
	};
</script>

<header
	class="supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b bg-background/95 shadow-sm backdrop-blur"
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
				{#if admins.includes($user?.email ?? '')}
					<Dropdown.Root>
						<Dropdown.Trigger asChild let:builder>
							<Button size="icon" variant="ghost" builders={[builder]}>
								<Download />
							</Button>
						</Dropdown.Trigger>
						<Dropdown.Content>
							<Dropdown.Item on:click={downloadAsJSON}>
								Download as JSON
							</Dropdown.Item>
							<Dropdown.Item on:click={downloadAsCSV}>
								Download as CSV
							</Dropdown.Item>
						</Dropdown.Content>
					</Dropdown.Root>
				{/if}
				<LightSwitch />
				<Dropdown.Root>
					<Dropdown.Trigger asChild let:builder>
						<Button builders={[builder]} size="icon" variant="ghost">
							<Avatar.Root>
								{#await profilePhoto then src}
									<Avatar.Image {src} />
								{/await}
								<Avatar.Fallback>
									{$user?.displayName?.slice(0, 2)}
								</Avatar.Fallback>
							</Avatar.Root>
						</Button>
					</Dropdown.Trigger>
					<Dropdown.Content>
						<Dropdown.Label class="text-lg">
							{$user?.displayName}
						</Dropdown.Label>
						<Dropdown.Label class="font-normal">{$user?.email}</Dropdown.Label>
						<Dropdown.Separator />
						<Dropdown.Item on:click={() => signOut(auth)}>
							<LogOut class="mr-2 h-4 w-4" />
							<span>Log out</span>
						</Dropdown.Item>
					</Dropdown.Content>
				</Dropdown.Root>
			</nav>
		</div>
	</div>
</header>
