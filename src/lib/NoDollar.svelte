<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	type $$Props = HTMLAttributes<SVGElement>;

	let className: $$Props['class'] = undefined;
	export { className as class };
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width="24"
	height="24"
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	class="lucide lucide-circle-dollar-sign {className}"
	{...$$restProps}
>
	<circle cx="12" cy="12" r="10" />
	<path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
	<path d="M12 18V6" />
	<path
		d="m 5.773375,5.7616909 c 0,0.048715 12.464934,12.4649341 12.464934,12.4649341"
	/>
</svg>
