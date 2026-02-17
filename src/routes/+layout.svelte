<script>
  import '../app.css';
  let { children } = $props();
</script>

<svelte:head>
  <title>Paint Matcher</title>
</svelte:head>

{@render children()}
