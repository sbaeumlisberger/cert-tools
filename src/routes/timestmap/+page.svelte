<script lang="ts">
	let timestamp = $state('');
	let parsed = $derived(parseTimestamp(timestamp));

	function parseTimestamp(timestamp: string): string {
		if (timestamp.trim().length === 0) {
			return '';
		}

		const num = Number(timestamp);
		if (isNaN(num)) {
			return 'Invalid timestamp';
		}

		const date =
			timestamp.trim().length === 10
				? new Date(num * 1000) // seconds to milliseconds
				: new Date(num); // already in milliseconds

		if (isNaN(date.getTime())) {
			return 'Invalid timestamp';
		}

		return date.toString() + '\n\nUTC: ' + date.toISOString();
	}
</script>

<svelte:head>
	<title>Certificate Tools - Parse timestamp</title>
</svelte:head>

<h2>Parse timestmap</h2>

<div style="display: flex; flex-direction: column; gap: 2rem; align-items: flex-start;">
	<input type="text" bind:value={timestamp} style="width: 400px;" />
	<span style="white-space: pre;">{parsed}</span>
</div>
