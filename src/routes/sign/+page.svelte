<script lang="ts">
	import PemInput from '$lib/components/pem-input.svelte';
	import PemOutput from '$lib/components/pem-output.svelte';
	import { importPrivateKeyPkcs8 } from '$lib/utils/crypto-util';
	import * as x509 from '@peculiar/x509';

	let csrInput: string = $state('');
	let privateKeyInput: string = $state('');

	let issuerName: string = $state('');

	let signedCertificate: string = $state('');

	async function signCertificate() {
		if (issuerName.length > 0 && !issuerName.includes('=')) {
			alert('Invalid issuer name');
			return;
		}

		signedCertificate = '';
		try {
			const csr = new x509.Pkcs10CertificateRequest(csrInput);

			// TODO: input for hash algorithm
			const privateKey = await importPrivateKeyPkcs8(privateKeyInput);

			const cert = await x509.X509CertificateGenerator.create({
				publicKey: csr.publicKey,
				subject: csr.subject,
				extensions: csr.extensions,
				issuer: issuerName.length > 0 ? issuerName : csr.subject,
				signingKey: privateKey
			});

			signedCertificate = cert.toString('pem');
		} catch (error) {
			console.error(error);
			signedCertificate = String(error);
		}
	}
</script>

<h2>Sign Certificate</h2>

<div style="display: flex; align-items: start; gap: 1rem; flex-wrap: wrap;">
	<PemInput bind:value={csrInput} placeholder="Paste your PEM encoded CSR (PKCS#10) here" />

	<div style="max-width: 100%;">
		<PemInput
			bind:value={privateKeyInput}
			placeholder="Paste your PEM encoded signing key (PKCS#8) here" />

		<br />
		<small>Supported key types: RSA, ECDSA (P-256, P-384, P521), Ed25519</small>
	</div>
</div>

<input
	type="text"
	style="margin-top: 1rem; width: 100%; max-width: 484px;"
	bind:value={issuerName}
	placeholder="Issuer Name (leave empty to use subject from CSR)" />

<br /><br />

<button onclick={signCertificate}>Sign Certificate</button>

<br /><br />

<PemOutput
	value={signedCertificate}
	placeholder="Signed certificate will appear here"
	filename="certificate.pem" />
