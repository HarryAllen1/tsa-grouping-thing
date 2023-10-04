<script lang="ts">
	import { OAuthProvider, signInWithPopup } from 'firebase/auth';
	import { auth } from '$lib';
	import * as Card from '$lib/components/card';
	import { Button } from '$lib/components/button';
	import { goto } from '$app/navigation';

	if (auth.currentUser) {
		goto('/');
	}

	const provider = new OAuthProvider('microsoft.com');
	provider.setCustomParameters({
		tenant: 'lwsd.onmicrosoft.com'
	});
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
				const user = await signInWithPopup(auth, provider);
				if (user) {
					goto('/');
				}
			}}
			class="w-full"
		>
			<img
				class="h-6 mr-4"
				src="https://supabase.com/dashboard/img/icons/microsoft-icon.svg"
				alt="Microsoft logo"
			/>
			Sign in with Microsoft</Button
		>
	</Card.Content>
</Card.Root>
