<script>
  import { onMount } from 'svelte';
  import PaintResult from '$lib/components/PaintResult.svelte';
  import { buildLabCache, findMatches } from '$lib/color-utils.js';

  // --- State ---
  /** @type {import('$lib/paint-data.js').Paint[]} */
  let allPaints = $state([]);
  let labCache = $state(new Map());
  let isLoading = $state(true);
  let query = $state('');
  let isFocused = $state(false);
  let inputRef = $state(null);

  /** @type {import('$lib/paint-data.js').Paint | null} */
  let selectedPaint = $state(null);
  let selectedName = $state('');

  /** @type {import('$lib/color-utils.js').PaintMatch[]} */
  let matches = $state([]);

  // --- Load data ---
  onMount(async () => {
    try {
      const response = await fetch('api/paints');
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      allPaints = await response.json();
      labCache = buildLabCache(allPaints);
    } catch (e) {
      console.error("Failed to load paint data:", e);
    } finally {
      isLoading = false;
    }
  });

  // --- Search suggestions ---
  const suggestions = $derived.by(() => {
    if (isLoading || !query || query.trim().length < 2) return [];
    if (selectedPaint && query === selectedName) return [];

    const norm = query.toLowerCase().trim();
    const results = [];

    for (const paint of allPaints) {
      const combined = `${paint.range} ${paint.name}`.toLowerCase();
      if (paint.name.toLowerCase().includes(norm) || combined.includes(norm)) {
        results.push(paint);
        if (results.length >= 8) break;
      }
    }
    return results;
  });

  const showSuggestions = $derived(isFocused && suggestions.length > 0 && query.length >= 2);

  // --- Actions ---
  function selectPaint(paint) {
    query = paint.name;
    selectedName = paint.name;
    selectedPaint = paint;
    matches = findMatches(paint, allPaints, labCache);
    isFocused = false;
    inputRef?.blur();
  }

  function clearQuery() {
    query = '';
    selectedPaint = null;
    selectedName = '';
    matches = [];
    inputRef?.focus();
  }

  function handleInput() {
    if (selectedPaint && query !== selectedName) {
      selectedPaint = null;
      selectedName = '';
      matches = [];
    }
  }

  function handleBlur() {
    setTimeout(() => isFocused = false, 200);
  }
</script>

<main>
  <div class="sticky-wrapper">
    <header>
      <div class="header-inner">
        <div class="logo-icon" aria-hidden="true">
          <img src="/web-app-manifest-192x192.png" alt="" width="38" height="38" />
        </div>
        <div>
          <h1>Paint Matcher</h1>
          <p class="subtitle">Find matching paints across miniature paint ranges</p>
        </div>
      </div>
    </header>

    <section class="search-section">
      <div class="search-wrapper">
        <div class="search-input-container">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
          <input
            bind:this={inputRef}
            bind:value={query}
            onfocus={() => isFocused = true}
            onblur={handleBlur}
            oninput={handleInput}
            type="text"
            placeholder="Search for a paint name..."
            aria-label="Search paint name"
            autocomplete="off"
            spellcheck="false"
          />
          {#if query}
            <button class="clear-btn" onclick={clearQuery} aria-label="Clear search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
          {/if}
        </div>

        {#if showSuggestions}
          <div class="suggestions-dropdown">
            {#each suggestions as paint (paint.range + paint.name)}
              <button class="suggestion-item" onclick={() => selectPaint(paint)}>
                <span class="suggestion-swatch" style="background-color: #{paint.hex};" aria-hidden="true"></span>
                <span class="suggestion-name">{paint.name}</span>
                <span class="suggestion-range">{paint.range}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </section>
  </div>

  <section class="results-section">
    {#if selectedPaint}
      <p class="result-count">
        {matches.length} equivalent{matches.length !== 1 ? 's' : ''} found for <strong>{selectedPaint.name}</strong>
      </p>
      <div class="results-list">
        <PaintResult paint={selectedPaint} {matches} query={selectedName} />
      </div>
    {:else if query.trim().length >= 2 && !isFocused && suggestions.length === 0 && !isLoading}
      <div class="empty-state">
        <p class="empty-primary">No matching paints found for <strong>"{query}"</strong></p>
        <p class="empty-secondary">Try searching for a paint name like "Blood Red" or "Mephiston"</p>
      </div>
    {:else}
      <div class="empty-state">
        <div class="empty-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
        </div>
        <p class="empty-primary">Search by paint name to find equivalents across brands</p>
      </div>
    {/if}
  </section>

  <footer>
    <div class="footer-inner">
      <p class="footer-note">
        Equivalents computed using CIEDE2000 perceptual color distance.
        Hex data from several different sources. Always test before committing to a project.
      </p>
      <div class="coffee">
        <p class="coffee-text">Enjoying this tool? Consider supporting its development:</p>
        <a href="https://buymeacoffee.com/joesoes" target="_blank" rel="noopener noreferrer" class="coffee-link">
          <img src="https://cdn.buymeacoffee.com/buttons/v2/default-orange.png" alt="Buy Me A Coffee" class="coffee-img" />
        </a>
      </div>
    </div>
  </footer>
</main>

<style>
  main {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .sticky-wrapper {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }

  header {
    background: var(--bg-card);
  }

  .header-inner {
    max-width: 680px;
    margin: 0 auto;
    padding: 16px 16px;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .logo-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
  }

  .logo-icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  h1 {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }

  .subtitle {
    font-size: 11px;
    color: var(--fg-muted);
  }

  .search-section {
    max-width: 680px;
    margin: 0 auto;
    padding: 12px 16px 16px;
    width: 100%;
  }

  .search-wrapper {
    position: relative;
  }

  .search-input-container {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 16px;
    color: var(--fg-muted);
    pointer-events: none;
  }

  input {
    width: 100%;
    height: 48px;
    padding: 0 48px 0 48px;
    background: var(--bg-card);
    color: var(--fg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 16px;
    font-family: var(--font-sans);
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
    -webkit-appearance: none;
  }

  input:focus {
    border-color: var(--ring);
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.04);
  }

  .clear-btn {
    position: absolute;
    right: 14px;
    color: var(--fg-muted);
    padding: 4px;
    border-radius: 6px;
    display: flex;
    background: transparent;
    border: none;
    cursor: pointer;
  }

  .suggestions-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    z-index: 50;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    overflow: hidden;
  }

  .suggestion-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 16px;
    text-align: left;
    border: none;
    border-bottom: 1px solid var(--border);
    background: transparent;
    cursor: pointer;
    color: inherit;
  }
  .suggestion-item:last-child { border-bottom: none; }
  .suggestion-item:hover { background-color: var(--bg-hover); }

  .suggestion-swatch {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    flex-shrink: 0;
    border: 1px solid var(--border);
  }
  .suggestion-name { font-size: 13px; font-weight: 500; }
  .suggestion-range { font-size: 11px; color: var(--fg-muted); margin-left: auto; }

  .results-section {
    max-width: 680px;
    margin: 0 auto;
    padding: 24px 16px 40px;
    width: 100%;
    flex: 1;
  }

  .result-count {
    font-size: 13px;
    color: var(--fg-muted);
    margin-bottom: 16px;
    padding-left: 4px;
  }

  .results-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .empty-state { text-align: center; padding: 56px 16px; }
  .empty-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--bg-card);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    color: var(--fg-muted);
  }

  .empty-primary { font-size: 14px; color: var(--fg-muted); }
  .empty-secondary { font-size: 12px; color: var(--fg-subtle); margin-top: 6px; }

  footer { border-top: 1px solid var(--border); margin-top: auto; }
  .footer-inner { max-width: 680px; margin: 0 auto; padding: 20px 16px 28px; text-align: center; }
  .footer-note { font-size: 12px; color: var(--fg-subtle); line-height: 1.6; }
  .footer-note a { color: var(--fg-muted); text-decoration: underline; text-underline-offset: 2px; }
  .coffee { margin-top: 16px; }
  .coffee-text { font-size: 11px; color: var(--fg-muted); margin-bottom: 10px; }
  .coffee-link { display: inline-block; transition: opacity 0.15s ease; }
  .coffee-img { height: 32px; width: auto; max-width: 140px; }
</style>
