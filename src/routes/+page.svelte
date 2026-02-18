<script>
  import { onMount } from 'svelte';
  import PaintResult from '$lib/components/PaintResult.svelte';

  // --- State ---
  let paintData = $state([]);
  let isLoading = $state(true);
  let query = $state('');
  let isFocused = $state(false);
  let inputRef = $state(null);

  /** @type {any | null} */
  let selectedEntry = $state(null);
  let selectedName = $state('');

  // --- Fetch Data ---
  onMount(async () => {
    try {
      const response = await fetch('api/paints'); 
      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      paintData = await response.json();
    } catch (e) {
      console.error("Failed to load paint data:", e);
    } finally {
      isLoading = false;
    }
  });

  // --- Logic ---
  const suggestions = $derived.by(() => {
    if (isLoading || !query || query.trim().length < 2) return [];
    if (selectedEntry && query === selectedName) return [];
    
    const norm = query.toLowerCase().trim();
    const seen = new Set();
    const matches = [];
    
    for (const entry of paintData) {
      for (const eq of entry.equivalents) {
        const key = `${eq.name}-${eq.range}`;
        if (!seen.has(key) && eq.name.toLowerCase().includes(norm)) {
          seen.add(key);
          matches.push({ name: eq.name, range: eq.range, hex: entry.hex, entry });
        }
      }
    }
    return matches.slice(0, 8);
  });

  const showSuggestions = $derived(isFocused && suggestions.length > 0 && query.length >= 2);

  function selectSuggestion(name, entry) {
    query = name;
    selectedName = name;
    selectedEntry = entry;
    isFocused = false;
    inputRef?.blur();
  }

  function clearQuery() {
    query = '';
    selectedEntry = null;
    selectedName = '';
    inputRef?.focus();
  }

  function handleInput() {
    if (selectedEntry && query !== selectedName) {
      selectedEntry = null;
      selectedName = '';
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z"></path>
            <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"></path>
            <path d="M14.5 17.5 4.5 15"></path>
          </svg>
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
            {#each suggestions as s, i (s.name + s.range + i)}
              <button class="suggestion-item" onclick={() => selectSuggestion(s.name, s.entry)}>
                <span class="suggestion-swatch" style="background-color: #{s.hex};" aria-hidden="true"></span>
                <span class="suggestion-name">{s.name}</span>
                <span class="suggestion-range">{s.range}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </section>
  </div>

  <section class="results-section">
    {#if selectedEntry}
      <p class="result-count">Equivalents for <strong>{selectedName}</strong></p>
      <div class="results-list">
        <PaintResult entry={selectedEntry} query={selectedName} />
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
        <p class="empty-secondary">Supports Citadel, Vallejo, Army Painter, Reaper, Scale 75 and more</p>
      </div>
    {/if}
  </section>

  <footer>
    <div class="footer-inner">
      <p class="footer-note">
        Colour equivalents are approximate. Always test before committing to a project. Color matcher is based on dakkadakka wiki data and all credits given to them.
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

  /* --- Sticky Logic --- */
  .sticky-wrapper {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--bg); /* Keeps results from showing behind the bar */
    border-bottom: 1px solid var(--border);
  }

  header {
    background: var(--bg-card);
  }

  .header-inner {
    max-width: 680px;
    margin: 0 auto;
    padding: 16px 16px; /* Tightened from 20px */
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .logo-icon {
    width: 38px; /* Slightly smaller for sticky layout */
    height: 38px;
    border-radius: 10px;
    background: var(--fg);
    color: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
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
    padding: 12px 16px 16px; /* Tightened from 28px */
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
    height: 48px; /* Slightly shorter for sticky layout */
    padding: 0 48px 0 48px;
    background: var(--bg-card);
    color: var(--fg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: 16px; /* Prevents iOS Zoom */
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

  /* Suggestions Dropdown */
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

  /* Results Section */
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
  .footer-note { font-size: 12px; color: var(--fg-subtle); }
  .coffee { margin-top: 16px; }
  .coffee-text { font-size: 11px; color: var(--fg-muted); margin-bottom: 10px; }
  .coffee-link { display: inline-block; transition: opacity 0.15s ease; }
  .coffee-img { height: 32px; width: auto; max-width: 140px; }
</style>
