<script lang="ts">
	import TextInput from '$lib/components/text-input.svelte';
	import TextOutput from '$lib/components/text-output.svelte';

	let input: string = $state('');
	let output: string = $state('');

	function decode() {
		try {
			output = decodeURIComponent(input);
		} catch (error) {
			console.error(error);
			output = String(error);
		}
	}

	function enocde() {
		try {
			output = encodeURIComponent(input);
		} catch (error) {
			console.error(error);
			output = String(error);
		}
	}
</script>

<svelte:head>
	<title>Certificate Tools - Decode/Encode URL</title>
</svelte:head>

<h2>Decode/Encode URL</h2>

<div style="display: flex; gap: 1rem 2rem; align-items: flex-start; flex-wrap: wrap;">
	<TextInput bind:value={input} placeholder="Paste or drop your input here" rows="30" wrap />

	<div style="display: flex; flex-direction: column; gap: 1rem;">
		<button onclick={decode}>Decode</button>
		<button onclick={enocde}>Encode</button>
	</div>

	<TextOutput value={output} placeholder="Output will appear here" rows="30" wrap />
</div>
