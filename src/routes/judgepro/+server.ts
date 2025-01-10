import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET = (() =>
	redirect(
		301,
		'https://judgepro.registermychapter.com/org/jpwa-tsastate/conf/jpwa-tsastate/student',
	)) satisfies RequestHandler;
