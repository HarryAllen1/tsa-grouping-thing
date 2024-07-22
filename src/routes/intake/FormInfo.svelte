<script lang="ts">
	import { db, user, userDoc } from '$lib';
	import * as Form from '$lib/components/ui/form';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { doc, getDoc, setDoc } from 'firebase/firestore';
	import CircleHelpIcon from 'lucide-svelte/icons/circle-help';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { dataForm, intakeFormSchema } from './intake-form-schema';
	import { onMount } from 'svelte';

	let {
		page = $bindable(),
	}: {
		page: number;
	} = $props();

	const form = superForm(dataForm, {
		validators: zodClient(intakeFormSchema),
		resetForm: false,
		onUpdated: async ({ form }) => {
			if (form.valid) {
				await setDoc(
					doc(db, 'users', $user.email),
					{
						// non-undefined values
						...Object.fromEntries(
							Object.keys(form.data)
								.filter((v) => (form.data as Record<string, unknown>)[v])
								.map((a) => [a, (form.data as Record<string, unknown>)[a]]),
						),
						grade: Number.parseInt(form.data.grade),
					},
					{
						merge: true,
					},
				);
				page++;
			}
		},
	});
	const { form: formData, enhance } = form;

	const capitalizeFirstLetter = (str: string) =>
		`${str.charAt(0).toUpperCase()}${str.slice(1).toLowerCase()}`;
	const tShirtMap = new Map([
		['W XS', 'W XS'],
		['W S', 'W Small'],
		['W M', 'W Medium'],
		['W L', 'W Large'],
		['W XL', 'W XL'],
		['W XXL', 'W XXL'],
		['M XS', 'M XS'],
		['M S', 'M Small'],
		['M M', 'M Medium'],
		['M L', 'M Large'],
		['M XL', 'M XL'],
		['M XXL', 'M XXL'],
	]);

	onMount(async () => {
		const userDoc = await getDoc(doc(db, 'users', $user.email ?? ''));
		const userData = userDoc.data()!;
		$formData.firstName =
			userData.firstName ??
			capitalizeFirstLetter($user.displayName?.split(', ')[1] ?? '');
		$formData.lastName =
			userData.lastName ??
			capitalizeFirstLetter($user.displayName?.split(', ')[0] ?? '');
		$formData.preferredFirstName = userData.preferredFirstName;
		$formData.grade =
			userData.grade?.toString() as typeof intakeFormSchema.shape.grade._type;
		$formData.gender =
			userData.gender as typeof intakeFormSchema.shape.gender._type;
		$formData.tShirtSize =
			userData.tShirtSize as typeof intakeFormSchema.shape.tShirtSize._type;
		$formData.demographic =
			userData.demographic as typeof intakeFormSchema.shape.demographic._type;
	});
</script>

<h1
	class="mb-6 mt-8 w-full scroll-m-20 text-start text-4xl font-extrabold tracking-tight lg:text-5xl"
>
	Intake Form
</h1>
<form method="POST" use:enhance>
	<Form.Field {form} name="firstName">
		<Form.Control let:attrs>
			<Form.Label>
				First name<span class="text-red-500 dark:text-red-400">*</span>
			</Form.Label>
			<Input {...attrs} bind:value={$formData.firstName} />
		</Form.Control>
		<Form.Description>
			This name should match your first name in Skyward. Please use the correct
			spacing and capitalization.
		</Form.Description>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="preferredFirstName">
		<Form.Control let:attrs>
			<Form.Label>Preferred name</Form.Label>
			<Input {...attrs} bind:value={$formData.preferredFirstName} />
		</Form.Control>
		<Form.Description>Optional.</Form.Description>
		<Form.FieldErrors />
	</Form.Field>
	<Form.Field {form} name="lastName">
		<Form.Control let:attrs>
			<Form.Label>
				Last name<span class="text-red-500 dark:text-red-400">*</span>
			</Form.Label>
			<Input {...attrs} bind:value={$formData.lastName} />
		</Form.Control>
		<Form.Description>
			This should match your last name in Skyward. Please use the correct
			spacing and capitalization.
		</Form.Description>
		<Form.FieldErrors />
	</Form.Field>
	<div class="grid grid-cols-1 md:grid-cols-2 md:space-x-2">
		<Form.Field {form} name="grade">
			<Form.Control let:attrs>
				<Select.Root
					selected={$userDoc.grade
						? {
								value: $userDoc.grade.toString(),
								label: $userDoc.grade.toString(),
							}
						: undefined}
					onSelectedChange={(v) => {
						if (v) {
							$formData.grade = v.value as '9' | '10' | '11' | '12';
						}
					}}
				>
					<Form.Label>
						Grade<span class="text-red-500 dark:text-red-400">*</span>
					</Form.Label>
					<Select.Trigger {...attrs}>
						<Select.Value />
					</Select.Trigger>
					<Select.Content>
						{#each ['9', '10', '11', '12'] as grade}
							<Select.Item value={grade}>
								{grade}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<input hidden bind:value={$formData.grade} name="grade" />
		<Form.Field {form} name="gender">
			<Form.Control let:attrs>
				<Select.Root
					selected={$userDoc.gender
						? { value: $userDoc.gender, label: $userDoc.gender }
						: undefined}
					onSelectedChange={(v) => {
						if (v) {
							$formData.gender = v.value as
								| 'Male'
								| 'Female'
								| 'Opt-Out'
								| 'Non-Disclosed';
						}
					}}
				>
					<Form.Label class="flex flex-row items-center gap-1">
						<p>Gender<span class="text-red-500 dark:text-red-400">*</span></p>
						<HoverCard.Root>
							<HoverCard.Trigger>
								<CircleHelpIcon class="size-5" />
							</HoverCard.Trigger>
							<HoverCard.Content>
								We need this information for rooming during State conference
								registration.
							</HoverCard.Content>
						</HoverCard.Root>
					</Form.Label>
					<Select.Trigger {...attrs}>
						<Select.Value />
					</Select.Trigger>
					<Select.Content>
						{#each ['Male', 'Female', 'Opt-Out', 'Non-Disclosed'] as gender}
							<Select.Item value={gender}>
								{gender}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<input hidden bind:value={$formData.gender} name="gender" />
		<Form.Field {form} name="demographic">
			<Form.Control let:attrs>
				<Select.Root
					selected={$userDoc.demographic
						? { value: $userDoc.demographic, label: $userDoc.demographic }
						: undefined}
					onSelectedChange={(v) => {
						if (v) {
							$formData.demographic = v.value as
								| 'Opt-Out'
								| 'Non-Disclosed'
								| 'American Indian/Alaskan Native'
								| 'Black / African-American'
								| 'Asian/Asian-American/Pacific Islander'
								| 'Hispanic/Latino'
								| 'Mixed Race'
								| 'White/Caucasian';
						}
					}}
				>
					<Form.Label class="flex flex-row items-center gap-1">
						<p>
							Demographic<span class="text-red-500 dark:text-red-400">*</span>
						</p>
						<HoverCard.Root>
							<HoverCard.Trigger>
								<CircleHelpIcon class="size-5" />
							</HoverCard.Trigger>
							<HoverCard.Content>
								National TSA requires this information.
							</HoverCard.Content>
						</HoverCard.Root>
					</Form.Label>
					<Select.Trigger {...attrs}>
						<Select.Value />
					</Select.Trigger>
					<Select.Content>
						{#each ['Opt-Out', 'Non-Disclosed', 'American Indian/Alaskan Native', 'Black / African-American', 'Asian/Asian-American/Pacific Islander', 'Hispanic/Latino', 'Mixed Race', 'White/Caucasian'] as demographic}
							<Select.Item value={demographic}>
								{demographic}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<input hidden bind:value={$formData.demographic} name="demographic" />
		<Form.Field {form} name="tShirtSize">
			<Form.Control let:attrs>
				<Select.Root
					selected={$userDoc.tShirtSize
						? {
								value: $userDoc.tShirtSize,
								label: tShirtMap.get($userDoc.tShirtSize),
							}
						: undefined}
					onSelectedChange={(v) => {
						if (v) {
							$formData.tShirtSize = v.value as
								| 'W XS'
								| 'W S'
								| 'W M'
								| 'W L'
								| 'W XL'
								| 'W XXL'
								| 'M XS'
								| 'M S'
								| 'M M'
								| 'M L'
								| 'M XL'
								| 'M XXL';
						}
					}}
				>
					<Form.Label class="flex flex-row items-center gap-1">
						<p>
							T-shirt size<span class="text-red-500 dark:text-red-400">*</span>
						</p>
						<HoverCard.Root>
							<HoverCard.Trigger>
								<CircleHelpIcon class="size-5" />
							</HoverCard.Trigger>
							<HoverCard.Content>
								You will get a polo shirt in this size during the State
								conference.
							</HoverCard.Content>
						</HoverCard.Root>
					</Form.Label>
					<Select.Trigger {...attrs}>
						<Select.Value />
					</Select.Trigger>
					<Select.Content>
						{#each tShirtMap as [abbr, size]}
							<Select.Item value={abbr}>
								{size}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<input hidden bind:value={$formData.tShirtSize} name="tShirtSize" />
	</div>
	<div class="mt-2 flex w-full flex-row justify-end">
		<Form.Button>Next</Form.Button>
	</div>
</form>
