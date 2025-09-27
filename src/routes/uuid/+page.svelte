<script lang="ts">
	let uuid = crypto.randomUUID();

	function generate() {
		uuid = crypto.randomUUID();
	}
</script>

<svelte:head>
	<title>Certificate Tools - Generate UUID</title>
</svelte:head>

<h2>Generate UUID (v4)</h2>

<div style="display: flex; gap: 1rem; align-items: flex-start; flex-wrap: wrap;">
	<input type="text" bind:value={uuid} style="width: 400px;" readonly />
	<button onclick={() => navigator.clipboard.writeText(uuid)}>Copy</button>
</div>
<br />
<button onclick={generate}>Generate new UUID</button>
