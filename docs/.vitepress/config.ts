import { defineConfig } from 'vitepress';

export default defineConfig({
	lang: 'en-US',
	title: 'TSA Team Creation Wizard Docs',
	cleanUrls: true,
	themeConfig: {
		search: {
			provider: 'local',
		},
		sidebar: [
			{
				text: 'Getting Started',
				link: '/',
			},
			{
				text: 'Member Pages',
				items: [
					{
						text: 'Signing In',
						link: '/member/signing-in',
					},
					{
						text: 'Teams',
						link: '/member/teams',
					},
					{
						text: 'Event Signup',
						link: '/member/signup',
					},
					{
						text: 'Results',
						link: '/member/results',
					},
					{
						text: 'Statistics',
						link: '/member/stats',
					},
				],
			},
			{
				text: 'Admin Pages',
				items: [
					{
						text: 'Teams',
						link: '/admin/teams',
					},
					{
						text: 'Members',
						link: '/admin/members',
					},
					{
						text: 'Submissions',
						link: '/admin/submissions',
					},
					{
						text: 'Results',
						link: '/admin/results',
					},
					{
						text: 'Rooming',
						link: '/admin/rooming',
					},
					{
						text: 'Cardboard Boat',
						link: '/admin/cardboard-boat',
					},
					{
						text: 'Registration',
						link: '/admin/registration',
					},
					{
						text: 'Resetting the System',
						link: '/admin/resetting',
					},
				],
			},
		],
	},
});
