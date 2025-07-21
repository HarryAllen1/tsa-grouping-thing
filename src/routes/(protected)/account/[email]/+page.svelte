<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import * as Select from '$lib/components/ui/select';
	import { db } from '$lib/firebase';
	import { tShirtMap } from '$lib/t-shirt';
	import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
	import { doc, getDoc, updateDoc } from 'firebase/firestore';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	const email = page.params.email;

	let initialized = $state(false);

	let formData = $state<{
		firstName: string;
		lastName: string;
		preferredFirstName: string | undefined;
		grade: '9' | '10' | '11' | '12' | undefined;
		gender: 'Male' | 'Female' | 'Opt-Out' | 'Non-Disclosed' | undefined;
		studentId: number | undefined;
		tShirtSize:
			| (typeof tShirtMap extends Map<infer K, unknown> ? K : never)
			| undefined;
		demographic:
			| 'American Indian/Alaskan Native'
			| 'Black / African-American'
			| 'Asian/Asian-American/Pacific Islander'
			| 'Hispanic/Latino'
			| 'Mixed Race'
			| 'White/Caucasian'
			| 'Opt-Out'
			| 'Non-Disclosed'
			| undefined;
		foundBy:
			| 'Friend/family'
			| 'Teacher'
			| 'JHS website club list'
			| 'Poster'
			| 'Social media'
			| 'Middle school'
			| 'Club fair'
			| 'Other'
			| undefined;
	}>({
		firstName: '',
		lastName: '',
		preferredFirstName: undefined,
		grade: undefined,
		gender: undefined,
		studentId: undefined,
		tShirtSize: undefined,
		demographic: undefined,
		foundBy: undefined,
	});

	onMount(async () => {
		const userDoc = await getDoc(doc(db, 'users', email ?? ''));
		const userData = userDoc.data()!;
		formData.firstName = userData.firstName ?? '';
		formData.lastName = userData.lastName ?? '';
		formData.preferredFirstName = userData.preferredFirstName;
		formData.grade = userData.grade?.toString();
		formData.studentId = userData.studentId || undefined;
		formData.gender = userData.gender;
		formData.tShirtSize = userData.tShirtSize;
		formData.demographic = userData.demographic;
		formData.foundBy = userData.foundBy;

		initialized = true;
	});
</script>

<svelte:head>
	<title>Admin Event Management — JHS TSA Teaming</title>
</svelte:head>

<div class="container mb-4">
	<h1
		class="mt-8 mb-6 w-full scroll-m-20 text-start text-4xl font-extrabold tracking-tight lg:text-5xl"
	>
		Intake Form
	</h1>
	<form
		class="flex flex-col gap-2"
		onsubmit={async (e) => {
			e.preventDefault();

			await updateDoc(doc(db, 'users', email ?? ''), {
				// non-undefined values
				...Object.fromEntries(
					Object.keys(formData)
						.filter((v) => (formData as Record<string, unknown>)[v])
						.map((a) => [a, (formData as Record<string, unknown>)[a]]),
				),
				preferredFirstName: formData.preferredFirstName || null,
				grade: Number.parseInt(formData.grade!),
			});
			toast.success('Saved.');
			history.back();
		}}
	>
		<div>
			<div>
				<Label>
					First name<span class="text-red-500 dark:text-red-400">*</span>
				</Label>
				<Input bind:value={formData.firstName} />
			</div>
			<p class="text-muted-foreground text-sm">
				This name should match your first name in Skyward. Please use the
				correct spacing and capitalization.
			</p>
		</div>
		<div>
			<div>
				<Label>Preferred first name</Label>
				<Input bind:value={formData.preferredFirstName} />
			</div>
			<p class="text-muted-foreground text-sm">
				Optional. This will be on your name tag at the State Conference.
			</p>
		</div>
		<div>
			<div>
				<Label>
					Last name<span class="text-red-500 dark:text-red-400">*</span>
				</Label>
				<Input bind:value={formData.lastName} />
			</div>
			<p class="text-muted-foreground text-sm">
				This should match your last name in Skyward. Please use the correct
				spacing and capitalization.
			</p>
		</div>
		{#if initialized}
			<div class="grid grid-cols-1 md:grid-cols-3 md:space-x-2">
				<div>
					<div>
						<Select.Root
							type="single"
							value={formData.grade?.toString()}
							onValueChange={(v) => {
								if (v) {
									formData.grade = v as '9' | '10' | '11' | '12';
								}
							}}
						>
							<div class="flex flex-row items-center gap-1">
								<Label>
									Grade<span class="text-red-500 dark:text-red-400">*</span>
								</Label>

								<Popover.Root>
									<Popover.Trigger>
										<CircleHelpIcon class="size-5" />
									</Popover.Trigger>
									<Popover.Content>
										National TSA requires this information.
									</Popover.Content>
								</Popover.Root>
							</div>

							<Select.Trigger class="w-full">
								<span>
									{formData.grade}
								</span>
							</Select.Trigger>
							<Select.Content>
								{#each ['9', '10', '11', '12'] as grade}
									<Select.Item value={grade}>
										{grade}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
				<input hidden bind:value={formData.grade} name="grade" />
				<div>
					<div>
						<div class="flex flex-row items-center gap-1">
							<Label class="flex flex-row">
								Student ID<span class="text-red-500 dark:text-red-400">*</span>
							</Label>
							<Popover.Root>
								<Popover.Trigger>
									<CircleHelpIcon class="size-5" />
								</Popover.Trigger>
								<Popover.Content>
									LWSD is switching switching everybody's email to use their
									student ID. However, for whatever reason, Microsoft still
									provides your old email when you log in. If/when emails get
									switched, having this information will make the migration
									easier. If you want more information about this change, please
									read <a
										href="https://www.lwsd.org/programs-and-services/technology"
										>LWSD's FAQs</a
									>.
								</Popover.Content>
							</Popover.Root>
						</div>
						<Input
							bind:value={formData.studentId}
							min="1000000"
							max="9999999"
							type="number"
						/>
					</div>
				</div>
				<div>
					<div>
						<Select.Root
							type="single"
							value={formData.gender}
							onValueChange={(v) => {
								if (v) {
									formData.gender = v as
										| 'Male'
										| 'Female'
										| 'Opt-Out'
										| 'Non-Disclosed';
								}
							}}
						>
							<div class="flex flex-row items-center gap-1">
								<Label class="flex flex-row items-center gap-1">
									Gender<span class="text-red-500 dark:text-red-400">*</span>
								</Label>
								<Popover.Root>
									<Popover.Trigger>
										<CircleHelpIcon class="size-5" />
									</Popover.Trigger>
									<Popover.Content>
										We need this information for rooming during State conference
										registration.
									</Popover.Content>
								</Popover.Root>
							</div>
							<Select.Trigger class="w-full">
								<span>
									{formData.gender}
								</span>
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="Male">Male</Select.Item>
								<Select.Item value="Female">Female</Select.Item>
								<Select.Item value="Non-Disclosed">Non-Binary</Select.Item>
								<Select.Item value="Opt-Out">Opt-Out</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
				</div>
				<input hidden bind:value={formData.gender} name="gender" />
			</div>
			<div class="grid grid-cols-1 md:grid-cols-3 md:space-x-2">
				<div>
					<div>
						<Select.Root
							type="single"
							value={formData.demographic}
							onValueChange={(v) => {
								if (v) {
									formData.demographic = v as
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
							<div class="flex flex-row items-center gap-1">
								<Label class="flex flex-row items-center gap-1">
									Demographic<span class="text-red-500 dark:text-red-400"
										>*</span
									>
								</Label>
								<Popover.Root>
									<Popover.Trigger>
										<CircleHelpIcon class="size-5" />
									</Popover.Trigger>
									<Popover.Content>
										National TSA requires this information.
									</Popover.Content>
								</Popover.Root>
							</div>
							<Select.Trigger class="w-full">
								<span>
									{formData.demographic}
								</span>
							</Select.Trigger>
							<Select.Content>
								{#each ['Opt-Out', 'Non-Disclosed', 'American Indian/Alaskan Native', 'Black / African-American', 'Asian/Asian-American/Pacific Islander', 'Hispanic/Latino', 'Mixed Race', 'White/Caucasian'] as demographic}
									<Select.Item value={demographic}>
										{demographic}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
				<input hidden bind:value={formData.demographic} name="demographic" />
				<div>
					<div>
						<Select.Root
							type="single"
							value={formData.tShirtSize}
							onValueChange={(v) => {
								if (v) {
									formData.tShirtSize = v as typeof tShirtMap extends Map<
										infer K,
										unknown
									>
										? K
										: never;
								}
							}}
						>
							<div class="flex flex-row items-center gap-1">
								<Label class="flex flex-row items-center gap-1">
									T-shirt size<span class="text-red-500 dark:text-red-400"
										>*</span
									>
								</Label>
								<Popover.Root>
									<Popover.Trigger>
										<CircleHelpIcon class="size-5" />
									</Popover.Trigger>
									<Popover.Content>
										You will get a polo shirt in this size during the State
										conference.
									</Popover.Content>
								</Popover.Root>
							</div>
							<Select.Trigger class="w-full">
								<span>
									{formData.tShirtSize
										? tShirtMap.get(formData.tShirtSize)
										: ''}
								</span>
							</Select.Trigger>
							<Select.Content>
								{#each tShirtMap as [abbr, size]}
									<Select.Item value={abbr}>
										{size}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
				<input hidden bind:value={formData.tShirtSize} name="tShirtSize" />
				<div>
					<div>
						<Select.Root
							type="single"
							value={formData.foundBy}
							onValueChange={(v) => {
								if (v) {
									formData.foundBy = v as
										| 'Friend/family'
										| 'Teacher'
										| 'JHS website club list'
										| 'Poster'
										| 'Social media'
										| 'Middle school'
										| 'Club fair'
										| 'Other';
								}
							}}
						>
							<div class="flex flex-row items-center gap-1">
								<Label class="flex flex-row items-center gap-1">
									How did you find out about us?<span
										class="text-red-500 dark:text-red-400">*</span
									>
								</Label>
								<Popover.Root>
									<Popover.Trigger>
										<CircleHelpIcon class="size-5" />
									</Popover.Trigger>
									<Popover.Content>Statistics 👍</Popover.Content>
								</Popover.Root>
							</div>
							<Select.Trigger class="w-full">
								<span>
									{formData.foundBy}
								</span>
							</Select.Trigger>
							<Select.Content>
								{#each ['Friend/family', 'Teacher', 'JHS website club list', 'Poster', 'Social media', 'Middle school', 'Club fair', 'Other'] as place}
									<Select.Item value={place}>
										{place}
									</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
				<input hidden bind:value={formData.foundBy} name="foundBy" />
			</div>
		{/if}
		<div class="mt-2 flex w-full flex-row justify-end">
			<Button type="submit">Save</Button>
		</div>
	</form>
</div>
