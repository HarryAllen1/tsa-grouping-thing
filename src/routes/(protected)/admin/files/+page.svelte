<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {} from '@zip.js/zip.js';

	let distributionPrefix = '';
	let distributionInputEl: HTMLInputElement;
</script>

<div class="container flex flex-col gap-4">
	<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
		Files
	</h1>

	<h2
		class="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
	>
		Distribute regionals/state results
	</h2>
	<p class="leading-7 [&:not(:first-child)]:mt-6">
		The following formatting rules <em>must</em> be followed:
	</p>
	<ul class="ml-6 list-disc [&>li]:mt-2">
		<li>The file must be in a zip format</li>
		<li>The zip file must contain 1 folder for each event</li>
		<li>In each event, the following rules <em>must</em> be abided to:</li>
		<ul class="ml-6 list-disc [&>li]:mt-2">
			<li>
				An individual event must be in the format (brackets are for emphasis
				only): <code>[competitor id]-J[judge number].pdf</code>
			</li>
			<li>
				A team event must be in the format (brackets are for emphasis only): <code
					>[3-5 digit event code]HS[school id]-[team number]-J[judge number].pdf</code
				>
			</li>
		</ul>
	</ul>
	<p>
		All files not following the above rules will be ignored. After uploading,
		the files will be distributed to the members.
	</p>
	<div>
		<Input
			type="text"
			placeholder="Distribution prefix"
			class="mb-4"
			bind:value={distributionPrefix}
		/>
		<Button
			on:click={() => {
				distributionInputEl.click();
			}}
		>
			Upload
		</Button>
		<input
			type="file"
			accept=".zip"
			class="hidden"
			on:change={() => {
				distributionInputEl = distributionInputEl;
			}}
			bind:this={distributionInputEl}
		/>
		<p class="my-4">
			Currently selected file: {distributionInputEl?.files?.[0]?.name ?? 'None'}
		</p>
		<Button disabled={!distributionInputEl?.files?.length}>Distribute</Button>
	</div>
</div>
