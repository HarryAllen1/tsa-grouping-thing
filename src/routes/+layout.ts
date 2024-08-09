import { dev } from '$app/environment';
import { inject } from '@vercel/analytics';

if (!dev) inject({ mode: 'production' });

export const ssr = false;
