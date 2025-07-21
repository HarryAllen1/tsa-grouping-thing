<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Textarea } from '$lib/components/ui/textarea';
	import { db } from '$lib/firebase';
	import { doc, getDoc, updateDoc } from 'firebase/firestore';
	import { onMount } from 'svelte';

	let open = $state(false);
	let alert = $state<string | number | string[] | null>('');

	onMount(async () => {
		alert = await getDoc(doc(db, 'settings', 'settings')).then(
			(doc) => doc.data()?.alert,
		);
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		<Button>Manage Alert</Button>
	</Dialog.Trigger>
	<Dialog.Content class="max-h-screen overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>Manage Alert</Dialog.Title>
			<Dialog.Description>
				Will be placed at the top of the homepage. Markdown is supported. Use
				the following shortcuts where needed:
				<ul class="my-6 ml-6 list-disc [&>li]:mt-2">
					<li>Washington id: {'{{washingtonId}}'}</li>
					<li>National id: {'{{nationalId}}'}</li>
					<li>First name: {'{{firstName}}'}</li>
					<li>Last name: {'{{lastName}}'}</li>
					<li>
						Counter (must be correctly formatted parsable <a
							href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format"
							target="_blank">Date string</a
						>): &lt;div class="counter"&gt;Fri Mar 01 2024 17:00:00 GMT-0800
						(Pacific Standard Time)&lt;/div&gt;
					</li>
					<li>
						Copyable: &lt;span class="copyable"&gt;copyable thing
						here&lt;/span&gt;
					</li>
				</ul>
			</Dialog.Description>
		</Dialog.Header>
		<Textarea
			autosize
			placeholder="Something something something..."
			spellcheck
			autocomplete="off"
			bind:value={alert}
		/>
		<Dialog.Footer>
			<Button
				class="mt-2"
				onclick={async () => {
					await updateDoc(doc(db, 'settings', 'settings'), { alert });
					open = false;
				}}
			>
				Save changes
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
