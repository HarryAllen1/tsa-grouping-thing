<script context="module" lang="ts">
	import { createToaster } from '@melt-ui/svelte';
	import { X } from 'lucide-svelte';
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';

	const {
		elements: { content, title, description, close },
		helpers: { addToast },
		states: { toasts },
		actions: { portal },
	} = createToaster<{
		title: string;
		description?: string;
		color?: string;
		textColor?: string;
	}>();

	export const toast = addToast;
</script>

<div
	class="fixed right-0 top-0 z-50 m-4 flex flex-col items-end gap-2 md:bottom-0 md:top-auto"
	use:portal
>
	{#each $toasts as { id, data } (id)}
		<div
			{...$content(id)}
			use:content
			animate:flip={{ duration: 500 }}
			in:fly={{ duration: 150, x: '100%' }}
			out:fly={{ duration: 150, x: '100%' }}
			class="rounded-lg {data.color ?? 'bg-neutral-800'} {data.textColor ??
				'text-white'} shadow-md"
		>
			<div
				class="relative flex w-[24rem] max-w-[calc(100vw-2rem)] items-center justify-between gap-4 p-5"
			>
				<div>
					<h3
						{...$title(id)}
						use:title
						class="flex items-center gap-2 font-semibold"
					>
						{data.title}
					</h3>
					{#if data.description}
						<div {...$description(id)} use:description>
							{data.description}
						</div>
					{/if}
				</div>
				<button
					{...$close(id)}
					use:close
					class="{data.textColor ??
						'text-white'} square-6 hover:bg-magnum-900/50 absolute right-4 top-4 grid place-items-center
          rounded-full"
				>
					<X class="square-4" />
				</button>
			</div>
		</div>
	{/each}
</div>
