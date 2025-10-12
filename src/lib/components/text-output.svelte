<script lang="ts">
	import { saveFile } from '../utils/common-utils';

	let { value = '', placeholder = '', rows = 20, wrap = false, filename = '' } = $props();
</script>

<div class="root-container">
	<textarea
		style="white-space: {wrap ? 'pre-wrap' : 'pre'};"
		{rows}
		cols="65"
		{value}
		readonly
		{placeholder}></textarea>

	<div class="buttons-container">
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

<style>
	.root-container {
		max-width: 100%;
		display: inline-flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	textarea {
		min-width: 0;
		max-height: 25vh;
		resize: none;
		font-family: monospace;
	}

	.buttons-container {
		display: flex;
		align-self: flex-end;
		flex-direction: row;
		gap: 0.5rem;
	}
</style>
