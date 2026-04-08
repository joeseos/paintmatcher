<script>
  import { getContrastColor } from '$lib/color-utils.js';

  let { paint, matches, query } = $props();

  let copiedHex = $state(false);

  function highlightName(name, q) {
    if (!q || !q.trim()) return name;
    const norm = q.toLowerCase().trim();
    const idx = name.toLowerCase().indexOf(norm);
    if (idx === -1) return name;
    const before = name.slice(0, idx);
    const match = name.slice(idx, idx + q.trim().length);
    const after = name.slice(idx + q.trim().length);
    return `${before}<mark>${match}</mark>${after}`;
  }

  async function copyHex(hex) {
    try {
      await navigator.clipboard.writeText(`#${hex}`);
      copiedHex = true;
      setTimeout(() => copiedHex = false, 2000);
    } catch {
      // fallback
    }
  }

  const textColor = $derived(getContrastColor(paint.hex));
  const closeMatches = $derived(matches.filter((m) => m.quality === 'match'));
  const nearMatches = $derived(matches.filter((m) => m.quality === 'near'));
</script>

<div class="result-card">
  <!-- Selected paint header -->
  <div
    class="color-header"
    style="background-color: #{paint.hex}; color: {textColor};"
  >
    <div class="header-info">
      <span class="header-name">{@html highlightName(paint.name, query)}</span>
      <span class="header-range">{paint.range}</span>
    </div>
    <button class="copy-btn" onclick={() => copyHex(paint.hex)} style="color: {textColor};" aria-label="Copy hex code #{paint.hex}">
      {#if copiedHex}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>Copied</span>
      {:else}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
        <span>#{paint.hex}</span>
      {/if}
    </button>
  </div>

  <!-- Match sections -->
  {#if closeMatches.length > 0}
    <div class="match-section">
      <div class="section-header">
        <span class="section-label match-label">Match</span>
        <span class="section-count">{closeMatches.length}</span>
      </div>
      {#each closeMatches as m (m.paint.range + m.paint.name)}
        <div class="equiv-row">
          <span class="equiv-swatch" style="background-color: #{m.paint.hex};" aria-hidden="true"></span>
          <div class="equiv-info">
            <span class="equiv-name">{m.paint.name}</span>
            <span class="equiv-range">{m.paint.range}</span>
          </div>
          <div class="equiv-meta">
            <span class="equiv-hex">#{m.paint.hex}</span>
            <span class="delta-badge match-badge" title="Delta E {m.deltaE.toFixed(1)}">
              ΔE {m.deltaE.toFixed(1)}
            </span>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if nearMatches.length > 0}
    <div class="match-section">
      <div class="section-header">
        <span class="section-label near-label">Near match</span>
        <span class="section-count">{nearMatches.length}</span>
      </div>
      {#each nearMatches as m (m.paint.range + m.paint.name)}
        <div class="equiv-row">
          <span class="equiv-swatch" style="background-color: #{m.paint.hex};" aria-hidden="true"></span>
          <div class="equiv-info">
            <span class="equiv-name">{m.paint.name}</span>
            <span class="equiv-range">{m.paint.range}</span>
          </div>
          <div class="equiv-meta">
            <span class="equiv-hex">#{m.paint.hex}</span>
            <span class="delta-badge near-badge" title="Delta E {m.deltaE.toFixed(1)}">
              ΔE {m.deltaE.toFixed(1)}
            </span>
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if closeMatches.length === 0 && nearMatches.length === 0}
    <div class="no-matches">
      <p>No equivalent paints found within ΔE 10</p>
    </div>
  {/if}
</div>

<style>
  .result-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .color-header {
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .header-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .header-name {
    font-size: 16px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header-name :global(mark) {
    background: rgba(255, 255, 255, 0.2);
    color: inherit;
    font-weight: 700;
    border-radius: 3px;
    padding: 0 2px;
  }

  .header-range {
    font-size: 12px;
    opacity: 0.75;
  }

  .copy-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    font-family: var(--font-mono);
    opacity: 0.7;
    transition: opacity 0.15s;
    padding: 4px 8px;
    border-radius: 6px;
    flex-shrink: 0;
  }
  .copy-btn:hover {
    opacity: 1;
  }

  .match-section {
    border-top: 1px solid var(--border);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px 6px;
  }

  .section-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .match-label {
    color: #4ade80;
  }

  .near-label {
    color: #facc15;
  }

  .section-count {
    font-size: 11px;
    color: var(--fg-subtle);
  }

  .equiv-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 20px;
    transition: background-color 0.12s;
  }
  .equiv-row:hover {
    background-color: var(--bg-hover);
  }

  .equiv-swatch {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    flex-shrink: 0;
    border: 1px solid var(--border);
  }

  .equiv-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
    flex: 1;
  }

  .equiv-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--fg);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .equiv-range {
    font-size: 12px;
    color: var(--fg-muted);
  }

  .equiv-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    flex-shrink: 0;
  }

  .equiv-hex {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--fg-subtle);
  }

  .delta-badge {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 500;
    padding: 1px 6px;
    border-radius: 4px;
  }

  .match-badge {
    color: #4ade80;
    background: rgba(74, 222, 128, 0.1);
  }

  .near-badge {
    color: #facc15;
    background: rgba(250, 204, 21, 0.1);
  }

  .no-matches {
    padding: 24px 20px;
    text-align: center;
    color: var(--fg-muted);
    font-size: 13px;
  }
</style>
