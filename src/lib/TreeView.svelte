<!-- derived from https://svelte.dev/repl/82b00644720a4ca2bdb89c6a653ec987?version=4.2.9 -->
<script context="module" lang="ts">
	export interface TreeNode {
		label: string;
		href?: string;
		children?: TreeNode[];
	}

	// retain ModuleScoped expansion state for each tree node
	// ... so collapsing a parent doesn't loose expansion state of children :-)
	const _expansionState: Record<string, boolean> = {
		// treeNodeId: expanded <boolean>
	};
</script>

<script lang="ts">
	export let tree: TreeNode;
	export let depth = 0; // INTERNAL: maintain depth

	// decompose each tree node
	const { label, children, href } = tree;

	// maintain expansion state
	// ... default to false on first occurance
	let expanded = _expansionState[label] || false;
</script>

<ul class="m-0 list-none pl-5">
	<li>
		{#if children}
			<details bind:open={expanded}>
				<summary>{label}</summary>
			</details>

			{#if expanded}
				{#each children as child}
					<svelte:self tree={child} depth={depth + 1} />
				{/each}
			{/if}
		{:else}
			<span class="pl-4">
				{#if href}
					<a {href} target="_blank" rel="noreferrer" class="underline">
						{label}
					</a>
				{:else}
					{label}
				{/if}
			</span>
		{/if}
	</li>
</ul>
