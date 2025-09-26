<script lang="ts">
	let { value = $bindable(''), placeholder = '', rows = 20, wrap = false } = $props();

	function drop(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer?.files?.length) {
			const file = event.dataTransfer.files[0];
			const reader = new FileReader();
			reader.onload = (e) => {
				value = String(e.target?.result ?? '');
			};
			reader.readAsText(file);
		}
	}
</script>

<textarea
	style="min-width: 0; max-width: 100%; resize: none; font-family: monospace; white-space: {wrap
		? 'pre-wrap'
		: 'pre'};"
	{rows}
	cols="65"
	bind:value
	{placeholder}
	ondrop={drop}
	ondragover={(event) => event.preventDefault()}></textarea>
