<script lang="ts">
	import PemInput from '$lib/components/pem-input.svelte';
	import { createPkcs12 } from '$lib/services/pkcs12';
	import { pemToArrayBuffer, saveFile } from '$lib/utils/common-utils';
	import { importPrivateKeyPkcs8 } from '$lib/utils/crypto-util';
	import * as x509 from '@peculiar/x509';

	let privateKeyInput: string = $state('');
	let certificatesInput: string = $state('');
	let password: string = $state('');
	let canBuild: boolean = $derived(
		privateKeyInput.length > 0 && certificatesInput.length > 0 && password.length > 0
	);

	async function buildPkcs12() {
		try {
			const privateKey = await importPrivateKeyPkcs8(privateKeyInput, true);
			const chain = certificatesInput
				.split(new RegExp('\n(?=-----BEGIN CERTIFICATE-----)'))
				.map((cert) => new x509.X509Certificate(pemToArrayBuffer(cert)));
			const pkcs12 = await createPkcs12(privateKey, chain, password);
			saveFile(new File([pkcs12], 'certificate.p12'));
		} catch (error) {
			console.error(error);
			alert(String(error));
		}
	}
</script>

<svelte:head>
	<title>Certificate Tools - PKCS#12 Builder</title>
</svelte:head>

<h2>PKCS#12 Builder</h2>

<PemInput
	bind:value={privateKeyInput}
	placeholder="Paste your PEM encoded private key (PKCS#8) here" />

<PemInput bind:value={certificatesInput} placeholder="Paste your PEM encoded certificates here" />

<br /><br />

<span>Password:</span>
<input type="password" bind:value={password} />

<br /><br />

<button onclick={buildPkcs12} disabled={!canBuild}>Build PKCS#12 file</button>
