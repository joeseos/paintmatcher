import { json } from '@sveltejs/kit';

/**
 * Transforms flat CSV rows into a grouped format: 
 * { hex: "ffffff", equivalents: [{name: "...", range: "..."}] }
 */
function transform(rows) {
  const map = new Map();

  for (const row of rows) {
    const hex = row.hex?.replace('#', '').toLowerCase();
    const name = row.name?.trim();
    const range = row.range?.trim();

    if (!hex || !name || !range) continue;

    if (!map.has(hex)) {
      map.set(hex, {
        hex,
        equivalents: []
      });
    }

    map.get(hex).equivalents.push({
      name,
      range
    });
  }

  return Array.from(map.values());
}

export const GET = async ({ fetch, setHeaders, url: requestUrl }) => {
  const sheetUrl = "https://opensheet.elk.sh/11_MINVNU2k1k6grZ3T03JGjOEdTdo4LZa6ZyidfklTw/Sheet1";

  // Check if "?refresh=true" is in the URL
  const forceRefresh = requestUrl.searchParams.get('refresh') === 'true';

  try {
    const res = await fetch(sheetUrl);
    
    if (!res.ok) {
      throw new Error(`Failed to fetch from Google Sheets: ${res.statusText}`);
    }

    const rows = await res.json();
    const data = transform(rows);

    if (forceRefresh) {
      // Bypass cache for this specific request
      setHeaders({
        "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "pragma": "no-cache",
        "expires": "0"
      });
    } else {
      // Standard 24h cache for regular users
      setHeaders({
        "cache-control": "public, max-age=86400, stale-while-revalidate=3600"
      });
    }

    return json(data);
  } catch (error) {
    console.error('API Error:', error);
    return json({ error: 'Failed to load paint data' }, { status: 500 });
  }
};
