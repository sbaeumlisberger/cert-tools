<script lang="ts">
	import * as x509 from '@peculiar/x509';
	import { exportPrivateKeyAsPem } from '$lib/utils/utils';
	import { CertData } from '$lib/models/cert-data';
	import CertDataComponent from '$lib/components/cert-data-component.svelte';
	import { LocalCa } from '$lib/services/local-ca';
	import PemOutput from '$lib/components/pem-output.svelte';

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

<div class="page-container">
	<div class="input-container">
		<div style="display: flex;">
			<button
				style="border-top-right-radius: 0; border-bottom-right-radius: 0; width: 16rem;"
				class:active={!useLocalCa}
				onclick={() => (useLocalCa = false)}>
				Self-signed
			</button>
			<button
				style="border-top-left-radius: 0; border-bottom-left-radius: 0; width: 16rem;"
				class:active={useLocalCa}
				onclick={() => (useLocalCa = true)}
				title="Use a locally created CA to sign the certificate. The certificate chain will be included in the output.">
				Local CA
			</button>
		</div>
		<CertDataComponent onchange={onCertDataChanged} />
		<button style="width: 100%;" onclick={generateCSR}>Generate Certificate</button>
	</div>
	<div class="output-container">
		<PemOutput
			value={certificate}
			placeholder="PEM encoded certificate will appear here"
			filename="certificate.pem" />
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
		min-width: 0;
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

	button.active {
		background-color: #dddddd;
	}
</style>
