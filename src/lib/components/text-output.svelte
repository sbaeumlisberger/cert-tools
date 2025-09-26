<script lang="ts">
	import { saveFile } from '../utils/common-utils';

	let { value = '', placeholder = '', rows = 20, wrap = false, filename = '' } = $props();
</script>

<div style="display: flex; gap: 0.5rem;">
	<textarea
		style="min-width: 0; resize: none; font-family: monospace; white-space: {wrap
			? 'pre-wrap'
			: 'pre'};"
		{rows}
		cols="65"
		{value}
		readonly
		{placeholder}></textarea>

	<div style="display: flex; flex-direction: column; gap: 0.5rem;">
		<button onclick={() => navigator.clipboard.writeText(value)} disabled={value.length === 0}>
			Copy
		</button>
		{#if filename}
			<button onclick={() => saveFile(new File([value], filename))} disabled={value.length === 0}>
				Save
			</button>
		{/if}
	</div>
</div>
