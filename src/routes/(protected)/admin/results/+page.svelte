<script lang="ts">
	import { eventsCollection, user } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
</script>

<div class="container my-4">
	<h2
		class="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
	>
		Elimination Results
	</h2>

	<div
		class="grid items-center w-full gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 lg:items-start"
	>
		{#each $eventsCollection as event}
			<Card.Root>
				<Card.Header>
					<Card.Title>
						{event.event}
					</Card.Title>
				</Card.Header>
				<Card.Content>
					{#if event.results}
						<ol class="my-6 ml-6 [&>li]:mt-2">
							{#each event.results.sort((a, b) => a.place - b.place) as result}
								<li>
									{result}
									{#if result.members
										.map((u) => u.email.toLowerCase())
										.includes($user.email?.toLowerCase() ?? '')}
										<span class="text-gray-500"> (you)</span>
									{/if}
								</li>
							{/each}
						</ol>
					{:else}
						<p class="text-gray-500">No results posted yet</p>
					{/if}
				</Card.Content>
				<Card.Footer>
					<Dialog.Root>
						<Dialog.Trigger>
							<Button>Add</Button>
						</Dialog.Trigger>
						<Dialog.Content></Dialog.Content>
					</Dialog.Root>
				</Card.Footer>
			</Card.Root>
		{/each}
	</div>
</div>
