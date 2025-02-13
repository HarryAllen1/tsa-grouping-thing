import { dev } from '$app/environment';
import {
	feedbackAsyncIntegration,
	handleErrorWithSentry,
	init,
	replayIntegration,
} from '@sentry/sveltekit';

if (!dev)
	init({
		dsn: 'https://0c7f0ce6a3dd0adedc74dfa71107da37@o4504343003791360.ingest.us.sentry.io/4507561453748224',
		tracesSampleRate: 1,

		// This sets the sample rate to be 10%. You may want this to be 100% while
		// in development and sample at a lower rate in production
		replaysSessionSampleRate: 0.1,

		// If the entire session is not sampled, use the below sample rate to sample
		// sessions when an error occurs.
		replaysOnErrorSampleRate: 1,

		// If you don't want to use Session Replay, just remove the line below:
		integrations: [
			replayIntegration(),
			feedbackAsyncIntegration({
				colorScheme: 'system',
				isEmailRequired: true,
			}),
		],
	});

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
