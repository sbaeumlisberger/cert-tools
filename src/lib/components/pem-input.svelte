<script lang="ts">
	let { value = $bindable(''), placeholder = '' } = $props();
</script>

<textarea
	style="min-width: 0; max-width: 100%; resize: none; font-family: monospace; white-space: pre;"
	rows="20"
	cols="65"
	bind:value
	{placeholder}></textarea>
