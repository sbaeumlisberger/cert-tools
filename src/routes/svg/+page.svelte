<script lang="ts">
	import TextInput from '$lib/components/text-input.svelte';
	import { saveFile } from '$lib/utils/common-utils';

	let input: string = $state('');
	let imageSource: string | null = $state(null);
	let imageLoaded: boolean = $state(false);
	let downloadEnabled: boolean = $derived(input.trim().length > 0 && imageLoaded);
	let targetWidth: number | null = $state(null);
	let targetHeight: number | null = $state(null);

	$effect(() => {
		imageSource = URL.createObjectURL(new Blob([input], { type: 'image/svg+xml' }));
		return () => URL.revokeObjectURL(imageSource!);
	});

	async function onFileUploaded(event: Event) {
		const inputElement = event.target as HTMLInputElement;
		if (inputElement.files && inputElement.files.length > 0) {
			input = await inputElement.files[0].text();
		}
	}

	function downloadAsPng() {
		try {
			const svgBlob = new Blob([input], { type: 'image/svg+xml' });
			const url = URL.createObjectURL(svgBlob);
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = targetWidth ?? img.width;
				canvas.height = targetHeight ?? img.height;
				const ctx = canvas.getContext('2d')!;
				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
				canvas.toBlob(async (blob) => {
					await saveFile(new File([blob!], 'image.png'));
				}, 'image/png');
				URL.revokeObjectURL(url);
			};
			img.onerror = (error) => {
				console.error('Error loading SVG:', error);
				URL.revokeObjectURL(url);
				alert(String(error));
			};
			img.src = url;
		} catch (error) {
			console.error(error);
			alert(String(error));
		}
	}

	function onImageLoaded() {
		imageLoaded = true;
	}

	function onImageError() {
		imageLoaded = false;
	}
</script>

<svelte:head>
	<title>Certificate Tools - Convert SVG to PNG</title>
</svelte:head>

<h2>Convert SVG to PNG</h2>

<div class="root-container">
	<div class="vertical-stack">
		<input type="file" accept="image/*" onchange={onFileUploaded} />
		<TextInput bind:value={input} rows={30} placeholder="Paste or drop your SVG here" />
	</div>

	<div class="vertical-stack" style="align-items: start;">
		<div class="download-container">
			<button onclick={downloadAsPng} disabled={!downloadEnabled}> Download as PNG </button>
			<input type="number" placeholder="Width (optional)" bind:value={targetWidth} />
			<input type="number" placeholder="Height (optional)" bind:value={targetHeight} />
		</div>
		<label for="img">Preview:</label>
		<img
			id="img"
			src={imageSource}
			alt=""
			width={targetWidth}
			height={targetHeight}
			onload={onImageLoaded}
			onerror={onImageError} />
	</div>
</div>

<style>
	.root-container {
		display: flex;
		flex-flow: row wrap;
		column-gap: 2rem;
		row-gap: 1rem;
	}

	.vertical-stack {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 100%;
	}

	.download-container {
		display: grid;
		grid-template-columns: repeat(2, minmax(0px, 1fr));
		gap: 1rem;
	}

	.download-container button {
		grid-column-end: span 2;
	}
</style>
