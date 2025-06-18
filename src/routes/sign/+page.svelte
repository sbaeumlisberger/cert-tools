<script lang="ts">
	import { importPrivateKeyPkcs8 } from '$lib/utils';
	import * as x509 from '@peculiar/x509';

	let csrInput: string = $state('');
	let privateKeyInput: string = $state('');

	let issuerName: string = $state('');

	let signedCertificate: string = $state('');

	async function signCertificate() {
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

<div style="display: flex; align-items: start; gap: 16px; flex-wrap: wrap;">
	<textarea
		cols="65"
		rows="20"
		class="monospace"
		bind:value={csrInput}
		placeholder="Paste your PEM encoded CSR (PKCS#10) here">
	</textarea>

	<div style="max-width: 100%;">
		<textarea
			cols="65"
			rows="20"
			class="monospace"
			bind:value={privateKeyInput}
			placeholder="Paste your PEM encoded signing key (PKCS#8) here">
		</textarea>
		<br />
		<small>Supported key types: RSA, ECDSA (P-256, P-384, P521), Ed25519</small>
	</div>
</div>

<input
	type="text"
	style="margin-top: 16px; width: 100%; max-width: 484px;"
	bind:value={issuerName}
	placeholder="Issuer Name (leave empty to use subject from CSR)" />

<br /><br />

<button onclick={signCertificate}>Sign Certificate</button>

<br /><br />

<textarea
	cols="65"
	rows={(signedCertificate.match(/\n/g)?.length || 18) + 2}
	class="monospace"
	value={signedCertificate}
	placeholder="Signed certificate will appear here"
	readonly></textarea>
