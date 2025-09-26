<script lang="ts">
	import TextInput from '$lib/components/text-input.svelte';
	import TextOutput from '$lib/components/text-output.svelte';

	let input: string = $state('');
	let output: string = $derived(format(input));

	function format(input: string): string {
		try {
			return input.trim().length > 0 ? JSON.stringify(JSON.parse(input), null, 2) : '';
		} catch (error) {
			return String(error);
		}
	}
</script>

<svelte:head>
	<title>Certificate Tools - JSON</title>
</svelte:head>

<h2>Format JSON</h2>

<div style="display: flex; gap: 2rem; align-items: flex-start; flex-wrap: wrap;">
	<TextInput bind:value={input} rows="30" placeholder="Paste or drop your input here" />
	<TextOutput value={output} rows="30" placeholder="Formatted JSON will appear here" />
</div>
