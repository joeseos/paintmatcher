<script>
  let { entry, query } = $props();

  let copiedHex = $state(false);

  function getContrastColor(hex) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#111111' : '#FFFFFF';
  }

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
      <div class="equiv-row">
        <div class="equiv-info">
          <span class="equiv-name">{@html highlightName(eq.name, query)}</span>
          <span class="equiv-range">{eq.range}</span>
        </div>
        <span class="equiv-swatch" style="background-color: #{entry.hex};" aria-hidden="true"></span>
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
  }

  .equiv-swatch {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    flex-shrink: 0;
    margin-left: 12px;
    border: 1px solid var(--border);
  }
</style>
