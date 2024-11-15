<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import { doc, setDoc } from 'firebase/firestore';
	import { db, tShirtMap, type UserDoc } from '$lib';

	let {
		user,
	}: {
		user: UserDoc;
	} = $props();

	let selectedTShirt = $state(
		user.tShirtSize ? tShirtMap.get(user.tShirtSize) : 'Unspecified',
	);
</script>

<Select.Root
	type="single"
	value={user.tShirtSize ?? 'null'}
	onValueChange={async (v) => {
		if (v)
			await setDoc(
				doc(db, 'users', user.email),
				{
					tShirtSize: v,
				},
				{ merge: true },
			);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		selectedTShirt = v ? tShirtMap.get(v as any) : 'Unspecified';
	}}
>
	<Select.Trigger class="mt-2 w-full">
		{selectedTShirt ?? 'T-Shirt Size'}
	</Select.Trigger>
	<Select.Content>
		{#each tShirtMap.entries() as [value, label]}
			<Select.Item {value}>{label}</Select.Item>
		{/each}
		<Select.Item value="null">Unspecified</Select.Item>
	</Select.Content>
</Select.Root>
