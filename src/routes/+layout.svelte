<script>
	import { onAuthStateChanged } from 'firebase/auth';
	import '../app.css';
	import { auth } from '$lib';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	onAuthStateChanged(auth, (user) => {
		if (!user && $page.url.pathname !== '/login') {
			goto('/login');
		}
	});
</script>

<div class="max-w-full flex flex-col items-center">
	<slot />
</div>
