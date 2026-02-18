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

  // --- Data Fetching ---
  onMount(async () => {
    try {
      const response = await fetch('/api/paints');
      if (!response.ok) throw new Error('Network response was not ok');
      paintData = await response.json();
    } catch (e) {
      console.error("Failed to load paints:", e);
    } finally {
      isLoading = false;
    }
  });

  // --- Logic ---
  const suggestions = $derived.by(() => {
    // Wait until data is loaded and query is at least 2 chars
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
    // Delay slightly to allow click event on suggestion to fire
    setTimeout(() => isFocused = false, 200);
  }
</script>

<main>
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
          placeholder={isLoading ? "Loading database..." : "Search for a paint name..."}
          disabled={isLoading}
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

  <section class="results-section">
    {#if isLoading}
      <div class="empty-state">
        <div class="loader"></div>
        <p class="empty-primary">Syncing paint database...</p>
      </div>
    {:else if selectedEntry}
      <p class="result-count">Equivalents for <strong>{selectedName}</strong></p>
      <div class="results-list">
        <PaintResult entry={selectedEntry} query={selectedName} />
      </div>
    {:else if query.trim().length >= 2 && !isFocused && suggestions.length === 0}
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
    </footer>
</main>

<style>
  /* ... (Existing styles) ... */

  /* Added Loader Style */
  .loader {
    width: 24px;
    height: 24px;
    border: 2px solid var(--border);
    border-top: 2px solid var(--fg);
    border-radius: 50%;
    margin: 0 auto 12px;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  input:disabled {
    cursor: wait;
    opacity: 0.7;
  }
</style>
