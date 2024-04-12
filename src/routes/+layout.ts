import { dev } from '$app/environment';
import { inject } from '@vercel/analytics';

!dev && inject({ mode: 'production' });

export const ssr = false;
export const prerender = true;
