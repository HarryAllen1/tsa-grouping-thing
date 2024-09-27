<script lang="ts">
	import { commandScore } from '$lib/command-score';
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import { cn } from '$lib/utils.js';
	import { Input } from '$lib/components/ui/input';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import { tick } from 'svelte';

	let {
		options,
		emptyText = 'No results found.',
		defaultOption = 'Select an option...',
		open = $bindable(false),
		value = $bindable(''),
		triggerClass,
		popoverClass,
		onSelect = () => {},
		searchBy = 'label',
	}: {
		options: { value: string; label: string }[];
		emptyText?: string;
		defaultOption?: string;
		open?: boolean;
		value?: string;
		triggerClass?: string;
		popoverClass?: string;
		onSelect?: (selected: { value: string; label: string }) => void;
		searchBy?: 'label' | 'value';
	} = $props();

	let filteredOptions = $derived(
		options
			.map((o) => ({
				...o,
				score: commandScore(o[searchBy], value),
			}))
			.filter((o) => o.label && o.value && o.score > 0)
			.toSorted((a, b) => b.score - a.score),
	);

	let selectedValue = $derived(
		filteredOptions.find((o) => o[searchBy] === value) ?? {
			label: defaultOption,
			value: '',
		},
	);

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	const closeAndFocusTrigger = async (triggerId: string) => {
		open = false;
		await tick();

		document.querySelector<HTMLElement>(`#${CSS.escape(triggerId)}`)?.focus();
	};
</script>

<Popover.Root bind:open let:ids>
	<Popover.Trigger asChild let:builder>
		<Button
			class={cn(
				'kiosk:h-12 kiosk:text-lg w-64 justify-between truncate',
				triggerClass,
			)}
			aria-expanded={open}
			builders={[builder]}
			role="combobox"
			variant="outline"
		>
			<span>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html selectedValue.label}
			</span>
			<ChevronsUpDown class="kiosk:size-6 ml-2 size-4 shrink-0 opacity-50" />
		</Button>
	</Popover.Trigger>
	<Popover.Content
		class={cn('relative max-h-[50vh] overflow-y-auto p-0', popoverClass)}
	>
		<Input
			placeholder="Search..."
			class="flex h-11 w-full rounded-md border-none bg-transparent py-3 text-sm outline-none ring-0 placeholder:text-muted-foreground focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
			bind:value
		/>
		<div class="flex flex-col border-t">
			{#each filteredOptions as option}
				<button
					class="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
					onclick={() => {
						value = '';
						onSelect(option);
						closeAndFocusTrigger(ids.trigger);
					}}
				>
					<Check
						class={cn(
							'mr-2 h-4 w-4',
							selectedValue[searchBy] !== option[searchBy] &&
								'text-transparent',
						)}
					/>
					{option.label}
				</button>
			{:else}
				<p>{emptyText}</p>
			{/each}
		</div>
	</Popover.Content>
</Popover.Root>
