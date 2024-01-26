<script lang="ts">
	import FileDropzone from '$lib/FileDropzone.svelte';
	import TreeView, { type TreeNode } from '$lib/TreeView.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		BlobReader,
		BlobWriter,
		ZipReader,
		type Entry,
	} from '@zip.js/zip.js';

	let distributionPrefix = '';
	let files: FileList;
	let entries: Entry[];
	let fileTreeData = {
		label: 'Root',
		children: [] as TreeNode[],
	} satisfies TreeNode;
	let ruleViolated = false;

	$: files, showPreview();

	const showPreview = async () => {
		if (!files?.length) {
			ruleViolated = true;
			return;
		}
		fileTreeData.label = files[0].name;
		if (!files[0].name.endsWith('.zip')) {
			ruleViolated = true;
			return;
		}
		entries = await new ZipReader(new BlobReader(files[0])).getEntries();

		if (!entries.length) return;

		for (const entry of entries) {
			if (!entry.filename.includes('/')) {
				ruleViolated = true;
				return;
			}
			if (!entry.filename.includes('J')) {
				ruleViolated = true;
				return;
			}
			const fullPath = entry.filename.split('/');
			const fileName = fullPath.pop();

			const existingFolder = fileTreeData.children.find(
				(child) => child.label === fullPath[0],
			);
			if (existingFolder) {
				existingFolder.children?.push({
					label: fileName ?? '',
					href:
						entry.getData && fileName?.endsWith('.pdf')
							? URL.createObjectURL(
									await entry.getData(new BlobWriter('application/pdf')),
								)
							: undefined,
				});
			} else {
				fileTreeData.children.push({
					label: fullPath[0],
					children: [
						{
							label: fileName ?? '',
							href:
								entry.getData && fileName?.endsWith('.pdf')
									? URL.createObjectURL(
											await entry.getData(new BlobWriter('application/pdf')),
										)
									: undefined,
						},
					],
				});
			}
		}
	};
</script>

<div class="container mt-4 flex flex-col gap-4">
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
				Optionally, the file can also be prefixed with <code>prelims-</code> or
				<code>semi-finals-</code>.
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

		<FileDropzone bind:files name="zip" accept=".zip" />

		<p class="my-4">
			Currently selected file: {files?.[0]?.name ?? 'None'}
		</p>
		{#if ruleViolated}
			<p>You violated a rule.</p>
		{:else if files?.length && fileTreeData}
			<TreeView tree={fileTreeData} />
		{/if}
		<Button disabled={!files?.length || ruleViolated}>Distribute</Button>
	</div>
</div>
