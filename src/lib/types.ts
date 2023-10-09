import type { DocumentData } from 'firebase/firestore';

export const correctTeamsDataType = (data: DocumentData[string]) =>
	data as { members: { name: string; email: string }[] }[];
