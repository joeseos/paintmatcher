<script>
  import { getContrastColor, deltaEHex, matchQuality } from '$lib/color-utils.js';

  let { entry, query } = $props();

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

  async function copyHex() {
    try {
      await navigator.clipboard.writeText(`#${entry.hex}`);
      copiedHex = true;
      setTimeout(() => copiedHex = false, 2000);
    } catch {
      // fallback
    }
  }

  /**
   * Get the display hex for an equivalent paint.
   * Uses per-paint hex if available, otherwise falls back to group hex.
   */
  function getEquivHex(eq) {
    return eq.hex || entry.hex;
  }

  /**
   * Get Delta E and match quality for an equivalent relative to the group hex.
   * Only meaningful when the equivalent has its own measured hex.
   */
  function getMatchInfo(eq) {
    if (!eq.hex) return null;
    const de = deltaEHex(entry.hex, eq.hex);
    return { deltaE: de, quality: matchQuality(de) };
  }

  const textColor = $derived(getContrastColor(entry.hex));
</script>

<div class="result-card">
  <div
    class="color-header"
    style="background-color: #{entry.hex}; color: {textColor};"
  >
    <span class="hex-code">#{entry.hex}</span>
    <button class="copy-btn" onclick={copyHex} style="color: {textColor};" aria-label="Copy hex code #{entry.hex}">
      {#if copiedHex}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>Copied</span>
      {:else}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
        <span>Copy</span>
      {/if}
    </button>
  </div>

  <div class="equivalents">
    {#each entry.equivalents as eq, i (eq.range + eq.name + i)}
      {@const eqHex = getEquivHex(eq)}
      {@const matchInfo = getMatchInfo(eq)}
      <div class="equiv-row">
        <div class="equiv-info">
          <span class="equiv-name">{@html highlightName(eq.name, query)}</span>
          <span class="equiv-range">
            {eq.range}
            {#if eq.hex}
              <span class="equiv-hex">#{eq.hex}</span>
            {/if}
          </span>
        </div>
        <div class="equiv-visual">
          {#if matchInfo}
            <span class="match-indicator" data-quality={matchInfo.quality}
              title="ΔE {matchInfo.deltaE.toFixed(1)} — {matchInfo.quality} match">
              {#if matchInfo.quality === 'exact' || matchInfo.quality === 'close'}✓
              {:else if matchInfo.quality === 'decent'}≈
              {:else}~{/if}
            </span>
          {/if}
          <span class="equiv-swatch" style="background-color: #{eqHex};" aria-hidden="true"></span>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .result-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .color-header {
    padding: 14px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .hex-code {
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 500;
    opacity: 0.9;
  }

  .copy-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    opacity: 0.7;
    transition: opacity 0.15s;
    padding: 4px 8px;
    border-radius: 6px;
  }
  .copy-btn:hover {
    opacity: 1;
  }

  .equivalents {
    display: flex;
    flex-direction: column;
  }

  .equiv-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    border-top: 1px solid var(--border);
    transition: background-color 0.12s;
  }
  .equiv-row:hover {
    background-color: var(--bg-hover);
  }

  .equiv-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .equiv-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--fg);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .equiv-name :global(mark) {
    background: rgba(255, 255, 255, 0.12);
    color: var(--fg);
    font-weight: 600;
    border-radius: 3px;
    padding: 0 2px;
  }

  .equiv-range {
    font-size: 12px;
    color: var(--fg-muted);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .equiv-hex {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--fg-subtle);
  }

  .equiv-visual {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    margin-left: 12px;
  }

  .match-indicator {
    font-size: 11px;
    font-weight: 600;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .match-indicator[data-quality="exact"],
  .match-indicator[data-quality="close"] {
    color: #4ade80;
  }
  .match-indicator[data-quality="decent"] {
    color: #facc15;
  }
  .match-indicator[data-quality="poor"] {
    color: #f87171;
  }

  .equiv-swatch {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    flex-shrink: 0;
    border: 1px solid var(--border);
  }
</style>
