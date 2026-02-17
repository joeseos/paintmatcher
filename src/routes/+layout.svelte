<script>
  import '../app.css';
  let { children } = $props();
</script>

<svelte:head>
  <title>Paint Equivalents Finder</title>
</svelte:head>

{@render children()}
