import { onDocumentUpdated } from 'firebase-functions/firestore';
import { db } from './firebase';
import { EventDoc } from './types';

export const logEventChanges = onDocumentUpdated(
	'events/{event_name}',
	(event) => {
		const beforeData = event.data?.before.data() as EventDoc;
		const afterData = event.data?.after.data() as EventDoc;
		db.collection('event_logs')
			.doc(Date.now().toString())
			.set({
				afterData,
				beforeData,
				updatedAt: Date.now(),
				updatedBy: afterData.lastUpdatedBy!,
			} satisfies {
				beforeData: EventDoc;
				afterData: EventDoc;
				updatedAt: number;
				updatedBy: string;
			});
	},
);
