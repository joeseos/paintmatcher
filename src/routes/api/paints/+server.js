import { json } from '@sveltejs/kit';
import { paintData } from '$lib/paint-data.js';

export const GET = async ({ setHeaders }) => {
  setHeaders({
    'cache-control': 'public, max-age=86400, stale-while-revalidate=3600',
  });

  return json(paintData);
};
