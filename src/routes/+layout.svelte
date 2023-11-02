<script>
	import { page } from '$app/stores';
	import { auth, db, storage } from '$lib';
	import { LightSwitch } from '$lib/components/light-switch';
	import { onAuthStateChanged } from 'firebase/auth';
	import { onDestroy } from 'svelte';
	import { FirebaseApp, userStore } from 'sveltefire';
	import '../app.css';

	const user = userStore(auth);

	$: if (!$user && $page.url.pathname !== '/login') {
		location.href = `/login?redirect=${$page.url.pathname}`;
	}

	const unsub = onAuthStateChanged(auth, async (user) => {
		if (!user && $page.url.pathname !== '/login') {
			location.href = `/login?redirect=${$page.url.pathname}`;
		}
		// if (user && !user?.email?.endsWith('@lwsd.org')) {
		// 	alert('You must use an LWSD account to log in.');
		// 	await auth.currentUser?.delete();
		// 	location.href = '/login';
		// }
	});

	onDestroy(unsub);
</script>

<div class="max-w-full flex flex-col items-center pt-4">
	<LightSwitch />
	<FirebaseApp {auth} firestore={db} {storage}>
		<slot />
	</FirebaseApp>
</div>
