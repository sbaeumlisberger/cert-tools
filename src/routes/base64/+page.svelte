<script lang="ts">
	import TextInput from '$lib/components/text-input.svelte';
	import TextOutput from '$lib/components/text-output.svelte';

	let input: string = $state('');
	let output: string = $state('');
	let urlSafe: boolean = $state(false);

	function decode() {
		try {
			let alphabet = urlSafe ? 'base64url' : 'base64';
			output = String.fromCharCode(...Uint8Array.fromBase64(input, { alphabet: alphabet }));
		} catch (error) {
			console.error(error);
			output = String(error);
		}
	}

	function enocde() {
		try {
			let alphabet = urlSafe ? 'base64url' : 'base64';
			output = Uint8Array.from(input, (c) => c.charCodeAt(0)).toBase64({ alphabet: alphabet });
		} catch (error) {
			console.error(error);
			output = String(error);
		}
	}
</script>

<svelte:head>
	<title>Certificate Tools - Base64</title>
</svelte:head>

<h2>Decode/Encode Base64</h2>

<div style="display: flex; gap: 1rem 2rem; align-items: flex-start; flex-wrap: wrap;">
	<TextInput bind:value={input} placeholder="Input" rows="30" wrap />

	<div style="display: flex; flex-direction: column; gap: 1rem;">
		<button onclick={decode}>Decode</button>
		<button onclick={enocde}>Encode</button>
		<span><input type="checkbox" bind:checked={urlSafe} /> URL-safe</span>
	</div>

	<TextOutput value={output} placeholder="Output" rows="30" wrap />
</div>
