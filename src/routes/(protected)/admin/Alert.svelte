<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { doc, getDoc, setDoc } from 'firebase/firestore';
	import { db } from '$lib';
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
	<Dialog.Content>
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
						>): {'<div class="counter">Fri Mar 01 2024 17:00:00 GMT-0800 (Pacific Standard Time)</div>'}
					</li>
					<li>
						Copyable: {'<span class="copyable">copyable thing here</span>'}
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
					await setDoc(
						doc(db, 'settings', 'settings'),
						{ alert },
						{ merge: true },
					);
					open = false;
				}}
			>
				Save changes
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
