<script lang="ts">
	import * as x509 from '@peculiar/x509';
	import { arrayBufferToPem } from '$lib/utils/utils';
	import { CertData } from '$lib/models/cert-data';
	import PemOutput from '$lib/components/pem-output.svelte';
	import CertDataComponent from '$lib/components/cert-data-component.svelte';

	let csr: string = $state('');
	let privateKey: string = $state('');

	let certData: CertData = new CertData();

	function onCertDataChanged(newCertData: CertData) {
		certData = newCertData;
	}

	async function generateCSR() {
		csr = '';
		privateKey = '';

		let alg: EcKeyGenParams | { name: 'Ed25519' } | RsaHashedKeyGenParams;
		if (certData.keyAlgorithm === 'ECDSA') {
			alg = {
				name: 'ECDSA',
				namedCurve: certData.ecCurve,
				hash: certData.hashAlgorithm
			};
		} else if (certData.keyAlgorithm === 'Ed25519') {
			alg = { name: 'Ed25519' };
		} else {
			alg = {
				name: 'RSASSA-PKCS1-v1_5',
				modulusLength: certData.rsaKeyLength,
				publicExponent: new Uint8Array([1, 0, 1]), // 65537
				hash: certData.hashAlgorithm
			};
		}

		const keys = (await crypto.subtle.generateKey(alg, true, ['sign', 'verify'])) as CryptoKeyPair;

		const extensions = [];

		if (certData.sans.some((san) => san.value.length > 0)) {
			extensions.push(
				new x509.SubjectAlternativeNameExtension(
					certData.sans
						.filter((san) => san.value.length > 0)
						.map((san) => new x509.GeneralName(san.type, san.value))
				)
			);
		}

		if (certData.keyUsages.some((keyUsage) => keyUsage.enabled)) {
			extensions.push(
				new x509.KeyUsagesExtension(
					certData.keyUsages.reduce(
						(acc, keyUsage) => (keyUsage.enabled ? acc | Number(keyUsage.flag) : acc),
						0
					)
				)
			);
		}

		if (certData.extendedKeyUsages.some((extendedKeyUsage) => extendedKeyUsage.enabled)) {
			extensions.push(
				new x509.ExtendedKeyUsageExtension(
					certData.extendedKeyUsages
						.filter((extendedKeyUsage) => extendedKeyUsage.enabled)
						.map((extendedKeyUsage) => extendedKeyUsage.value)
				)
			);
		}

		const csrPkcs10 = await x509.Pkcs10CertificateRequestGenerator.create({
			name: certData.subject,
			keys: keys,
			signingAlgorithm: alg,
			extensions: extensions
		});

		csr = csrPkcs10.toString('pem');
		privateKey = await exportPrivateKey(keys.privateKey);
	}

	async function exportPrivateKey(key: CryptoKey): Promise<string> {
		const keyData = await crypto.subtle.exportKey('pkcs8', key);
		return arrayBufferToPem(keyData, '-----BEGIN PRIVATE KEY-----', '-----END PRIVATE KEY-----');
	}
</script>

<h2>Create CSR</h2>

<div class="page-container">
	<div class="input-container">
		<CertDataComponent onchange={onCertDataChanged} />
		<button style="width: 100%;" onclick={generateCSR}>Generate CSR</button>
	</div>

	<div class="output-container">
		<PemOutput value={csr} placeholder="CSR (PKCS#10) will appear here" filename="csr.pem" />
		<PemOutput
			value={privateKey}
			placeholder="Private key (PKCS#8) will appear here"
			filename="private-key.pem" />
	</div>
</div>

<style>
	.page-container {
		display: flex;
		flex-direction: row;
		gap: 2rem;
		justify-content: space-between;
		flex-wrap: wrap;
	}

	.input-container {
		flex: 0 1 512px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.output-container {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 1rem;
	}
</style>
