<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="container mx-auto mt-4">
	<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
		{$page.status}: {$page.error?.message}
	</h1>
</div>
