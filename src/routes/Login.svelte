<script lang="ts">
	import { auth, yay } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import confetti from 'canvas-confetti';
	import {
		OAuthProvider,
		browserLocalPersistence,
		setPersistence,
		signInWithPopup,
	} from 'firebase/auth';

	const provider = new OAuthProvider('microsoft.com');
	provider.addScope('email');
	provider.addScope('openid');
	provider.addScope('profile');
</script>

<Card.Root class="mx-16 max-w-md md:mx-48 lg:mx-96">
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
					confetti();
					yay.play();
				}
			}}
			class="mt-4"
		>
			<svg
				height="100%"
				viewBox="0 0 20 20"
				width="100%"
				class="mr-4 aspect-square bg-white p-[1px]"
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
