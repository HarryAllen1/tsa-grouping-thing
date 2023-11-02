<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib';
	import { Button } from '$lib/components/button';
	import * as Card from '$lib/components/card';
	import {
		OAuthProvider,
		browserLocalPersistence,
		setPersistence,
		signInWithPopup,
	} from 'firebase/auth';
	import { userStore } from 'sveltefire';

	const user = userStore(auth);

	$: if ($user) {
		const params = $page.url.searchParams.get('redirect');
		if (params) {
			goto(params);
		}
		goto('/');
	}

	const provider = new OAuthProvider('microsoft.com');
	provider.addScope('email');
	provider.addScope('openid');
	provider.addScope('profile');
</script>

<Card.Root class="mx-16 md:mx-48 lg:mx-96 mt-16 max-w-md">
	<Card.Header>
		<Card.Title>Login</Card.Title>
	</Card.Header>
	<Card.Content>
		<Button
			on:click={async () => {
				await setPersistence(auth, browserLocalPersistence);
				const user = await signInWithPopup(auth, provider);

				if (!user.user.email?.endsWith('@lwsd.org')) {
					alert('You must use an LWSD account to log in.');
					await user.user.delete();
				}

				if (user.user) {
					const cred = OAuthProvider.credentialFromResult(user);
					localStorage.setItem('accessToken', cred?.accessToken ?? '');
					const params = $page.url.searchParams.get('redirect');
					if (params) {
						goto(params);
					}
					goto('/');
				}
			}}
			class="w-full"
		>
			<svg
				height="100%"
				viewBox="0 0 20 20"
				width="100%"
				class="h-6 mr-4 bg-white p-[1px]"
				preserveAspectRatio="xMidYMid meet"
				focusable="false"
			>
				<g fill="none">
					<path d="M0 0h9.504v9.504H0z" fill="#F25022" />
					<path d="M10.496 0H20v9.504h-9.504z" fill="#7FBA00" />
					<path d="M0 10.496h9.504V20H0z" fill="#00A4EF" />
					<path d="M10.496 10.496H20V20h-9.504z" fill="#FFB900" />
				</g>
			</svg>
			Sign in with Microsoft
		</Button>
	</Card.Content>
</Card.Root>
