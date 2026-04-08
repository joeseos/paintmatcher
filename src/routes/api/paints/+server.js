import { json } from '@sveltejs/kit';
import { lookupHex } from '$lib/hex-lookup.js';

/**
 * Transform raw rows into grouped paint entries with per-paint hex values.
 * Each equivalent gets its own hex from RedGrimm data where available,
 * falling back to the shared group hex.
 */
function transform(rows) {
  const map = new Map();
  for (const row of rows) {
    const hex = row.hex?.replace('#', '').toUpperCase();
    const name = row.name?.trim();
    const range = row.range?.trim();
    if (!hex || !name || !range) continue;
    if (!map.has(hex)) {
      map.set(hex, { hex, equivalents: [] });
    }
    // Look up per-paint hex from RedGrimm data
    const paintHex = lookupHex(range, name);
    const equivalent = { name, range };
    if (paintHex) {
      equivalent.hex = paintHex;
    }
    map.get(hex).equivalents.push(equivalent);
  }
  return Array.from(map.values());
}

const SHEET_ID = "11_MINVNU2k1k6grZ3T03JGjOEdTdo4LZa6ZyidfklTw";

async function fetchSheetRows(fetchFn, bustCache = false) {
  const base = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&sheet=Sheet1`;
  const url = bustCache ? `${base}&_cb=${Date.now()}` : base;

  const res = await fetchFn(url, bustCache ? { cache: 'no-store' } : {});
  if (!res.ok) throw new Error(`Failed to fetch sheet: ${res.statusText}`);

  const text = await res.text();

  const [headerLine, ...lines] = text.trim().split('\n');
  const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  return lines.map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  });
}

export const GET = async ({ fetch, setHeaders, url: requestUrl }) => {
  const forceRefresh = requestUrl.searchParams.get('refresh') === 'true';

  try {
    const rows = await fetchSheetRows(fetch, forceRefresh);
    const data = transform(rows);

    if (forceRefresh) {
      setHeaders({
        'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'pragma': 'no-cache',
        'expires': '0'
      });
    } else {
      setHeaders({
        'cache-control': 'public, max-age=86400, stale-while-revalidate=3600'
      });
    }

    return json(data);
  } catch (error) {
    console.error('API Error:', error);
    return json({ error: 'Failed to load paint data' }, { status: 500 });
  }
};
