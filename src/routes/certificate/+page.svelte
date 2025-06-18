<script lang="ts">
	import * as x509 from '@peculiar/x509';
	import { exportPrivateKeyAsPem } from '$lib/utils';
	import { CertData } from '$lib/cert-data';
	import CertDataComponent from '$lib/cert-data-component.svelte';
	import { LocalCa } from '$lib/local-ca';

	let certificate: string = $state('');
	let privateKey: string = $state('');

	let certData: CertData = new CertData();

	let useLocalCa: boolean = $state(false);

	function onCertDataChanged(newCertData: CertData) {
		certData = newCertData;
	}

	async function generateCSR() {
		certificate = '';
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

		if (useLocalCa) {
			const localCa = await LocalCa.create();
			const x509Cert = await localCa.signCsr(
				await x509.Pkcs10CertificateRequestGenerator.create({
					name: certData.subject,
					keys: keys,
					signingAlgorithm: alg,
					extensions: extensions
				})
			);
			certificate = x509Cert.toString('pem') + '\n' + localCa.exportChain();
		} else {
			const x509Cert = await x509.X509CertificateGenerator.createSelfSigned({
				signingAlgorithm: alg,
				keys,
				name: certData.subject,
				extensions: extensions
			});
			certificate = x509Cert.toString('pem');
		}

		privateKey = await exportPrivateKeyAsPem(keys.privateKey);
	}
</script>

<h2>Create Certificate</h2>

<div style="display: flex;">
	<button
		style="border-top-right-radius: 0; border-bottom-right-radius: 0; width: 128px;"
		class:active={!useLocalCa}
		onclick={() => (useLocalCa = false)}>
		Self-signed
	</button>
	<button
		style="border-top-left-radius: 0; border-bottom-left-radius: 0; width: 128px;"
		class:active={useLocalCa}
		onclick={() => (useLocalCa = true)}
		title="Use a locally created CA to sign the certificate. The certificate chain will be included in the output.">
		Local CA
	</button>
</div>

<br />

<CertDataComponent onchange={onCertDataChanged} />

<br />

<button onclick={generateCSR}>Generate Certificate</button>

<br /><br />

<textarea
	rows="20"
	cols="65"
	class="monospace"
	value={certificate}
	readonly
	placeholder="PEM encoded certificate will appear here"></textarea>
<textarea
	rows="20"
	cols="65"
	class="monospace"
	value={privateKey}
	readonly
	placeholder="Private key (PKCS#8) will appear here"></textarea>

<style>
	button.active {
		background-color: #007acc;
		color: white;
	}
</style>
