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

export const GET = async ({ fetch, setHeaders }) => {
  const url =
    "https://opensheet.elk.sh/11_MINVNU2k1k6grZ3T03JGjOEdTdo4LZa6ZyidfklTw/Sheet1";

  const res = await fetch(url);
  const rows = await res.json();

  const data = transform(rows);

  // 24h cache
  setHeaders({
    "cache-control": "public, max-age=86400, stale-while-revalidate=3600"
  });

  return new Response(JSON.stringify(data));
};
