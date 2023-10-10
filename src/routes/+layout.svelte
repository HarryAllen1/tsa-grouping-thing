<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth, db, storage } from '$lib';
	import { LightSwitch } from '$lib/components/light-switch';
	import { onAuthStateChanged } from 'firebase/auth';
	import { FirebaseApp } from 'sveltefire';
	import '../app.css';

	onAuthStateChanged(auth, async (user) => {
		if (!user && $page.url.pathname !== '/login') {
			await goto('/login');
		}
		if (user && !user?.email?.endsWith('lwsd.org')) {
			alert('You must use an LWSD account to log in.');
			await auth.currentUser?.delete();
			await goto('/login');
		}
	});
</script>

<div class="max-w-full flex flex-col items-center pt-4">
	<LightSwitch />
	<FirebaseApp {auth} firestore={db} {storage}>
		<slot />
	</FirebaseApp>
</div>
