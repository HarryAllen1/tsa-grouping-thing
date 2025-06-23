<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { allUsersCollection, eventsCollection } from '$lib/stores';
	import Copy from '@lucide/svelte/icons/copy';
	import { toast } from 'svelte-sonner';

	const copyStuff = () => {
		const stuff: {
			email: string;
			waId: number;
			natId: number;
			gender: string;
			tShirt: string;
			events: {
				eventId: number;
				teamNumber: number;
				isCaptain: boolean;
				event: string;
				isTeamEvent: boolean;
			}[];
		}[] = [];

		for (const u of $allUsersCollection.filter((u) => u.events.length > 0)) {
			const events: {
				eventId: number;
				teamNumber: number;
				isCaptain: boolean;
				event: string;
				isTeamEvent: boolean;
			}[] = [];
			for (const event of u.events) {
				const team = $eventsCollection
					.find((e) => e.event === event)
					?.teams.find((t) => t.members.find((m) => m.email === u.email));
				const eventInfo = $eventsCollection.find((e) => e.event === event);

				if (team && eventInfo) {
					events.push({
						event: eventInfo.event,
						eventId: eventInfo.id,
						teamNumber: team.teamNumber,
						isTeamEvent: eventInfo.maxTeamSize > 1,
						isCaptain:
							team.teamCaptain?.toLowerCase() === u.email?.toLowerCase(),
					});
				}
			}

			stuff.push({
				email: u.email,
				waId: u.washingtonId ?? 0,
				natId: u.nationalId ?? 0,
				tShirt: u.tShirtSize ?? 'Unspecified',
				gender: u.gender ?? 'Non-Binary',
				events,
			});
		}

		navigator.clipboard.writeText(JSON.stringify(stuff, null, 2));
	};
</script>

<Button
	size="icon"
	onclick={() => {
		copyStuff();
		toast.success('Copied to clipboard');
	}}
>
	<Copy />
</Button>
