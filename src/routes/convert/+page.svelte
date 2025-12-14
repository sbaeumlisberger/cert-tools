<script lang="ts">
	import { saveFile } from '$lib/utils/common-utils';
	import * as x509 from '@peculiar/x509';

	async function handlePemFileChange(event: Event) {
		try {
			const input = event.target as HTMLInputElement;
			if (input.files && input.files.length > 0) {
				const pem = await input.files[0].text();
				const cert = new x509.X509Certificate(pem);
				await saveFile(new File([cert.rawData], 'certificate.der'));
				input.value = '';
			}
		} catch (error: any) {
			alert(String(error));
		}
	}

	async function handleDerFileChange(event: Event) {
		try {
			const input = event.target as HTMLInputElement;
			if (input.files && input.files.length > 0) {
				const der = await input.files[0].arrayBuffer();
				const cert = new x509.X509Certificate(der);
				await saveFile(new File([cert.toString('pem')], 'certificate.pem'));
				input.value = '';
			}
		} catch (error: any) {
			alert(String(error));
		}
	}
</script>

<svelte:head>
	<title>Certificate Tools - Convert PEM/DER</title>
</svelte:head>

<h2>Convert PEM/DER</h2>

<div class="page-container">
	<div class="group">
		<h3>PEM to DER</h3>
		<span>Convert from textual encoding (RFC 7468) to binary encoding (DER).</span>
		<input type="file" accept=".pem,.cer,.crt" onchange={(e) => handlePemFileChange(e)} />
	</div>

	<div class="group">
		<h3>DER to PEM</h3>
		<span>Convert from binary encoding (DER) to textual encoding (RFC 7468).</span>
		<input type="file" accept=".der,.cer,.crt" onchange={(e) => handleDerFileChange(e)} />
	</div>
</div>

<style>
	.page-container {
		display: flex;
		flex-direction: column;
		gap: 3rem;
	}

	.group {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.group h3 {
		margin: 0rem;
	}

	.group input[type='file'] {
		padding: 0rem;
		border: none;
		color: transparent;
	}

	.group input[type='file']::file-selector-button {
		color: var(--text-color);
	}
</style>
