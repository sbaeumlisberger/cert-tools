<script lang="ts">
	import { IcoImageInfo } from '$lib/models/ico-image-info';
	import { IcoEncoder } from '$lib/services/ico-encoder';
	import { saveFile } from '$lib/utils/common-utils';

	let imageLoaded: boolean = $state(false);
	let imageSource: string | null = $state(null);
	let resolutions = $state([
		{ size: 32, include: true },
		{ size: 48, include: true },
		{ size: 64, include: true },
		{ size: 128, include: true },
		{ size: 256, include: true }
	]);
	let downloadEnabled: boolean = $derived(imageLoaded && resolutions.some((r) => r.include));

	function onFileUploaded(event: Event) {
		imageSource = null;
		imageLoaded = false;
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			imageSource = URL.createObjectURL(input.files[0]);
		}
	}

	async function saveAsIco() {
		try {
			const icoEncoder = new IcoEncoder();
			for (const resolution of resolutions) {
				if (resolution.include) {
					await addResolution(icoEncoder, resolution.size);
				}
			}
			const icoBlob = icoEncoder.commit();
			await saveFile(new File([icoBlob], 'icon.ico'));
		} catch (error) {
			console.error(error);
			alert(String(error));
		}
	}

	function addResolution(icoEncoder: IcoEncoder, resolution: number): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				const img = new Image();
				img.onload = () => {
					const canvas = document.createElement('canvas');
					canvas.width = Math.min(img.width, resolution);
					canvas.height = Math.min(img.height, resolution);
					const ctx = canvas.getContext('2d')!;
					ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
					canvas.toBlob((blob) => {
						icoEncoder.addImage(new IcoImageInfo(blob!, canvas.width, canvas.height, 0, 32));
						resolve();
					}, 'image/png');
				};
				img.onerror = (error) => {
					console.error('Error loading image:', error);
					alert(String(error));
				};
				img.src = imageSource!;
			} catch (error) {
				reject(error);
			}
		});
	}

	function onImageLoaded() {
		imageLoaded = true;
	}

	function onImageError() {
		imageLoaded = false;
	}
</script>

<svelte:head>
	<title>Certificate Tools - Convert image to ICO</title>
</svelte:head>

<h2>Convert image to ICO</h2>

<div class="root-container">
	<input type="file" accept="image/*" onchange={onFileUploaded} />

	<p class="gap-before">Included resolutions</p>
	<div class="resolutions-container">
		{#each resolutions as res}
			<div>
				<input type="checkbox" bind:checked={res.include} id={'res-' + res.size} />
				<label for={'res-' + res.size}>{res.size}x{res.size}</label>
			</div>
		{/each}
	</div>

	<button class="gap-before" disabled={!downloadEnabled} onclick={saveAsIco}>
		Convert to ICO
	</button>

	<p class="gap-before">Preview</p>
	<div class="preview-container">
		{#each resolutions as res}
			<img
				src={imageSource}
				alt=""
				width={res.size}
				height={res.size}
				hidden={!res.include}
				style="border: 1px solid black;"
				onload={onImageLoaded}
				onerror={onImageError} />
		{/each}
	</div>
</div>

<style>
	.root-container {
		display: flex;
		flex-direction: column;
		align-items: start;
	}

	.root-container > * {
		max-width: 100%;
	}

	.gap-before {
		margin-block-start: 2rem;
	}

	.resolutions-container {
		display: flex;
		flex-flow: row wrap;
		gap: 1rem;
	}

	.preview-container {
		display: flex;
		flex-flow: row wrap;
		gap: 1rem;
		align-items: flex-start;
	}
</style>
