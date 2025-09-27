<script lang="ts">
	import TextInput from '$lib/components/text-input.svelte';
	import TextOutput from '$lib/components/text-output.svelte';

	let input: string = $state('');
	let output: string = $derived(format(input));

	function format(input: string): string {
		if (input.trim().length === 0) {
			return '';
		}

		try {
			const parser = new DOMParser();
			const xmlDoc = parser.parseFromString(input, 'application/xml');

			if (xmlDoc.getElementsByTagName('parsererror').length) {
				throw new Error('Invalid XML');
			}

			const serializer = new XMLSerializer();
			const xml = serializer.serializeToString(xmlDoc);

			const lines = xml.replace(/>\s*</g, '>\n<').split('\n');
			let depth = 0;

			return lines
				.map((line) => {
					if (line.match(/^<\/\w/)) depth--; // closing tag
					const padding = ' '.repeat(depth * 2);
					if (line.match(/^<\w[^>]*[^\/]>$/)) depth++; // opening tag
					return padding + line;
				})
				.join('\n');
		} catch (error) {
			return String(error);
		}
	}
</script>

<svelte:head>
	<title>Certificate Tools - Format XML</title>
</svelte:head>

<h2>Format XML</h2>

<div style="display: flex; gap: 2rem; align-items: flex-start; flex-wrap: wrap;">
	<TextInput bind:value={input} rows="30" placeholder="Paste or drop your input here" />
	<TextOutput value={output} rows="30" placeholder="Formatted XML will appear here" />
</div>
