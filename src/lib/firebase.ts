import { dev } from '$app/environment';
import {
	PUBLIC_FIREBASE_API_KEY,
	PUBLIC_FIREBASE_EMULATORS,
} from '$env/static/public';
import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import {
	connectFirestoreEmulator,
	doc,
	getFirestore,
	setDoc,
} from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { getPerformance } from 'firebase/performance';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const firebaseConfig = {
	apiKey:
		PUBLIC_FIREBASE_API_KEY ||
		/* restricted key */ 'AIzaSyA-_aVUnDt3gOHjtoFwO4S1vSGSnZtCvAU',
	authDomain: 'tsa-grouping-thing.firebaseapp.com',
	projectId: 'tsa-grouping-thing',
	storageBucket: 'tsa-grouping-thing.appspot.com',
	messagingSenderId: '1034710953450',
	appId: '1:1034710953450:web:20baf0bbc221b34fcfd693',
	measurementId: 'G-V9TSZ35FNE',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export const functions = getFunctions(app);

if (PUBLIC_FIREBASE_EMULATORS === 'true') {
	connectAuthEmulator(auth, 'http://127.0.0.1:9099');
	connectFirestoreEmulator(db, '127.0.0.1', 8080);
	connectStorageEmulator(storage, '127.0.0.1', 9199);
	connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}

if (!dev) getPerformance(app);

export const sendEmail = async (
	to: string | string[],
	subject: string,
	body: string,
) =>
	setDoc(doc(db, `mail/${Date.now()}`), {
		to: Array.isArray(to) ? to : [to],
		message: {
			subject,
			html: body,
		},
	});

export const lookupMsAzureProfilePhoto = async (accessToken: string) => {
	const response = await fetch(
		'https://graph.microsoft.com/v1.0/me/photo/$value',
		{
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'image/jpg',
			},
		},
	);
	const blob = await response.blob();
	return URL.createObjectURL(blob);
};
