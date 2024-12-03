import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp();

export const db = getFirestore();
export const allowedDomains = new Set(['lwsd.org', 'kampmusic.org']);
