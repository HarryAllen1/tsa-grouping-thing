<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import type { EventDoc } from '$lib/types';
	import { diffWords } from 'diff';
	import Maximize from 'lucide-svelte/icons/maximize';

	interface Props {
		beforeData: EventDoc;
		afterData: EventDoc;
	}
	let { beforeData, afterData }: Props = $props();

	const sortJSON = (object: object) => {
		if (Array.isArray(object)) {
			for (let i = 0; i < object.length; i++) {
				object[i] = sortJSON(object[i]);
			}
			return object;
		} else if (typeof object !== 'object') return object;

		if ('ref' in object) {
			delete object.ref;
		}
		const keys = Object.keys(object).toSorted();
		const newObject = {};
		for (let i = 0; i < keys.length; i++) {
			// @ts-ignore
			newObject[keys[i]] = sortJSON(object[keys[i]]);
		}
		return newObject;
	};
</script>

<Dialog.Root>
	<Dialog.Trigger
		class={buttonVariants({
			variant: 'outline',
			size: 'icon',
		})}
	>
		<Maximize class="h-6 w-6" />
	</Dialog.Trigger>
	<Dialog.Content class="max-h-screen overflow-y-auto">
		<pre>{#each diffWords(JSON.stringify(sortJSON(beforeData), null, 2), JSON.stringify(sortJSON(afterData), null, 2)) as { added, removed, value }}{#if added}<span
						class="bg-green-100 dark:bg-green-900">{value}</span
					>{:else if removed}<span class="bg-red-100 dark:bg-red-900"
						>{value}</span
					>{:else}{value}{/if}{/each}</pre>
	</Dialog.Content>
</Dialog.Root>
