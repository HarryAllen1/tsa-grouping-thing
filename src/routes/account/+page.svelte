<script lang="ts">
	import { goto } from '$app/navigation';
	import { db, user, userDoc } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { doc, getDoc, setDoc } from 'firebase/firestore';
	import CircleHelpIcon from 'lucide-svelte/icons/circle-help';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	let studentIdHoverCardOpen = $state(false);
	let genderHoverCardOpen = $state(false);
	let demographicHoverCardOpen = $state(false);
	let tShirtSizeHoverCardOpen = $state(false);

	let formData = $state<{
		firstName: string;
		lastName: string;
		preferredFirstName: string | undefined;
		grade: '9' | '10' | '11' | '12' | undefined;
		gender: 'Male' | 'Female' | 'Opt-Out' | 'Non-Disclosed' | undefined;
		studentId: number | undefined;
		tShirtSize:
			| 'F XS'
			| 'F S'
			| 'F M'
			| 'F L'
			| 'F XL'
			| 'F XXL'
			| 'M XS'
			| 'M S'
			| 'M M'
			| 'M L'
			| 'M XL'
			| 'M XXL'
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

	const capitalizeFirstLetter = (str: string) =>
		`${str.charAt(0).toUpperCase()}${str.slice(1).toLowerCase()}`;
	const tShirtMap = new Map([
		['F XS', 'F XS'],
		['F S', 'F Small'],
		['F M', 'F Medium'],
		['F L', 'F Large'],
		['F XL', 'F XL'],
		['F XXL', 'F XXL'],
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
		formData.firstName =
			userData.firstName ??
			($user.displayName?.includes(',')
				? capitalizeFirstLetter($user.displayName?.split(', ')[1] ?? '')
				: capitalizeFirstLetter($user.displayName?.split(' ')[0] ?? ''));
		formData.lastName =
			userData.lastName ??
			($user.displayName?.includes(',')
				? capitalizeFirstLetter($user.displayName?.split(', ')[0] ?? '')
				: capitalizeFirstLetter($user.displayName?.split(' ')[1] ?? ''));
		formData.preferredFirstName = userData.preferredFirstName;
		formData.grade = userData.grade?.toString();
		formData.studentId = userData.studentId || undefined;
		formData.gender = userData.gender;
		formData.tShirtSize = userData.tShirtSize;
		formData.demographic = userData.demographic;
		formData.foundBy = userData.foundBy;
	});
</script>

<div class="container mb-4">
	<h1
		class="mb-6 mt-8 w-full scroll-m-20 text-start text-4xl font-extrabold tracking-tight lg:text-5xl"
	>
		Intake Form
	</h1>
	<form
		class="flex flex-col gap-2"
		onsubmit={async (e) => {
			e.preventDefault();

			await setDoc(
				doc(db, 'users', $user.email ?? ''),
				{
					// non-undefined values
					...Object.fromEntries(
						Object.keys(formData)
							.filter((v) => (formData as Record<string, unknown>)[v])
							.map((a) => [a, (formData as Record<string, unknown>)[a]]),
					),
					preferredFirstName:
						(formData.preferredFirstName?.trim() === formData.firstName.trim()
							? null
							: formData.preferredFirstName) || '',
					grade: Number(formData.grade),
				},
				{
					merge: true,
				},
			);
			toast.success('Saved.');
			await goto('/');
		}}
	>
		<div>
			<div>
				<Label>
					First name<span class="text-red-500 dark:text-red-400">*</span>
				</Label>
				<Input
					required
					pattern="^[a-zA-Z\- ]+"
					bind:value={formData.firstName}
				/>
			</div>
			<p class="text-sm text-muted-foreground">
				This name should match your first name in Skyward. Please use the
				correct spacing and capitalization.
			</p>
		</div>
		<div>
			<div>
				<Label>
					Preferred first name (if not the same as your Skyward name)
				</Label>
				<Input
					pattern="^[a-zA-Z\- ]*"
					bind:value={formData.preferredFirstName}
				/>
			</div>
			<p class="text-sm text-muted-foreground">Optional.</p>
		</div>
		<div>
			<div>
				<Label>
					Last name<span class="text-red-500 dark:text-red-400">*</span>
				</Label>
				<Input
					required
					pattern="^[a-zA-Z\- ]+"
					bind:value={formData.lastName}
				/>
			</div>
			<p class="text-sm text-muted-foreground">
				This should match your last name in Skyward. Please use the correct
				spacing and capitalization.
			</p>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-3 md:space-x-2">
			<div>
				<div>
					<Select.Root
						required
						selected={$userDoc.grade
							? {
									value: $userDoc.grade.toString(),
									label: $userDoc.grade.toString(),
								}
							: undefined}
						onSelectedChange={(v) => {
							if (v) {
								formData.grade = v.value as '9' | '10' | '11' | '12';
							}
						}}
					>
						<Label>
							Grade<span class="text-red-500 dark:text-red-400">*</span>
						</Label>
						<Select.Trigger>
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
				</div>
			</div>
			<input required hidden bind:value={formData.grade} name="grade" />
			<div>
				<div>
					<div class="flex flex-row items-center gap-1">
						<Label class="flex flex-row">
							Student ID<span class="text-red-500 dark:text-red-400">*</span>
						</Label>
						<HoverCard.Root bind:open={studentIdHoverCardOpen}>
							<HoverCard.Trigger asChild let:builder>
								<button
									type="button"
									{...builder}
									use:builder.action
									onclick={() => {
										studentIdHoverCardOpen = !studentIdHoverCardOpen;
									}}
								>
									<CircleHelpIcon class="size-5" />
								</button>
							</HoverCard.Trigger>
							<HoverCard.Content>
								LWSD is switching switching everybody's email to use their
								student ID. However, for whatever reason, Microsoft still
								provides your old email when you log in. If/when emails get
								switched, having this information will make the migration
								easier. If you want more information about this change, please
								read <a
									href="https://www.lwsd.org/programs-and-services/technology"
									>LWSD's FAQs</a
								>.
							</HoverCard.Content>
						</HoverCard.Root>
					</div>
					<Input
						required
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
						required
						selected={$userDoc.gender
							? { value: $userDoc.gender, label: $userDoc.gender }
							: undefined}
						onSelectedChange={(v) => {
							if (v) {
								formData.gender = v.value as
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
							<HoverCard.Root bind:open={genderHoverCardOpen}>
								<HoverCard.Trigger asChild let:builder>
									<button
										{...builder}
										use:builder.action
										type="button"
										onclick={() => {
											genderHoverCardOpen = !genderHoverCardOpen;
										}}
									>
										<CircleHelpIcon class="size-5" />
									</button>
								</HoverCard.Trigger>
								<HoverCard.Content>
									We need this information for rooming during State conference
									registration.
								</HoverCard.Content>
							</HoverCard.Root>
						</div>
						<Select.Trigger>
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
				</div>
			</div>
			<input required hidden bind:value={formData.gender} name="gender" />
		</div>
		<div class="grid grid-cols-1 md:grid-cols-3 md:space-x-2">
			<div>
				<div>
					<Select.Root
						required
						selected={$userDoc.demographic
							? { value: $userDoc.demographic, label: $userDoc.demographic }
							: undefined}
						onSelectedChange={(v) => {
							if (v) {
								formData.demographic = v.value as
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
								Demographic<span class="text-red-500 dark:text-red-400">*</span>
							</Label>
							<HoverCard.Root bind:open={demographicHoverCardOpen}>
								<HoverCard.Trigger asChild let:builder>
									<button
										{...builder}
										use:builder.action
										type="button"
										onclick={() => {
											demographicHoverCardOpen = !demographicHoverCardOpen;
										}}
									>
										<CircleHelpIcon class="size-5" />
									</button>
								</HoverCard.Trigger>
								<HoverCard.Content>
									National TSA requires this information.
								</HoverCard.Content>
							</HoverCard.Root>
						</div>
						<Select.Trigger>
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
				</div>
			</div>
			<input
				required
				hidden
				bind:value={formData.demographic}
				name="demographic"
			/>
			<div>
				<div>
					<Select.Root
						required
						selected={$userDoc.tShirtSize
							? {
									value: $userDoc.tShirtSize,
									label: tShirtMap.get($userDoc.tShirtSize),
								}
							: undefined}
						onSelectedChange={(v) => {
							if (v) {
								formData.tShirtSize = v.value as
									| 'F XS'
									| 'F S'
									| 'F M'
									| 'F L'
									| 'F XL'
									| 'F XXL'
									| 'M XS'
									| 'M S'
									| 'M M'
									| 'M L'
									| 'M XL'
									| 'M XXL';
							}
						}}
					>
						<div class="flex flex-row items-center gap-1">
							<Label class="flex flex-row items-center gap-1">
								T-shirt size<span class="text-red-500 dark:text-red-400">*</span
								>
							</Label>
							<HoverCard.Root bind:open={tShirtSizeHoverCardOpen}>
								<HoverCard.Trigger asChild let:builder>
									<button
										{...builder}
										use:builder.action
										type="button"
										onclick={() => {
											tShirtSizeHoverCardOpen = !tShirtSizeHoverCardOpen;
										}}
									>
										<CircleHelpIcon class="size-5" />
									</button>
								</HoverCard.Trigger>
								<HoverCard.Content>
									You will get a polo shirt in this size during the State
									conference.
								</HoverCard.Content>
							</HoverCard.Root>
						</div>
						<Select.Trigger>
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
				</div>
			</div>
			<input
				required
				hidden
				bind:value={formData.tShirtSize}
				name="tShirtSize"
			/>
			<div>
				<div>
					<Select.Root
						required
						selected={$userDoc.foundBy
							? {
									value: $userDoc.foundBy,
									label: $userDoc.foundBy,
								}
							: undefined}
						onSelectedChange={(v) => {
							if (v) {
								formData.foundBy = v.value as
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
						</div>
						<Select.Trigger>
							<Select.Value />
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
			<input required hidden bind:value={formData.foundBy} name="foundBy" />
		</div>
		<div class="mt-2 flex w-full flex-row justify-end">
			<Button type="submit">Save</Button>
		</div>
	</form>
</div>
