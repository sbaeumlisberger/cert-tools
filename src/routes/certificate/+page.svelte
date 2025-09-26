<script lang="ts">
	import CertDataComponent from '$lib/components/cert-data-component.svelte';
	import TextOutput from '$lib/components/text-output.svelte';
	import { CertData } from '$lib/models/cert-data';
	import { LocalCa } from '$lib/services/local-ca';
	import { createPkcs12 } from '$lib/services/pkcs12';
	import { pemToArrayBuffer, saveFile } from '$lib/utils/common-utils';
	import { exportPrivateKeyAsPem } from '$lib/utils/crypto-util';
	import { validateCertData } from '$lib/utils/validation-util';
	import * as x509 from '@peculiar/x509';

	let certificate: string = $state('');
	let privateKey: string = $state('');

	let certData: CertData = new CertData();

	let useLocalCa: boolean = $state(false);

	let password: string = $state('');

	let keyPair: CryptoKeyPair;

	function onCertDataChanged(newCertData: CertData) {
		certData = newCertData;
	}

	async function generateCSR() {
		if (!validateCertData(certData)) {
			return;
		}

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

		keyPair = (await crypto.subtle.generateKey(alg, true, ['sign', 'verify'])) as CryptoKeyPair;

		const extensions = [];

		if (certData.sans.some((san) => san.value.length > 0)) {
			extensions.push(
				new x509.SubjectAlternativeNameExtension(
					certData.sans
						.filter((san) => san.value.length > 0)
						.map((san) => new x509.GeneralName(san.type, san.value)),
					certData.subject.length === 0
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
					name: certData.subject || undefined,
					keys: keyPair,
					signingAlgorithm: alg,
					extensions: extensions
				})
			);
			certificate = x509Cert.toString('pem') + '\n' + localCa.exportChain();
		} else {
			const x509Cert = await x509.X509CertificateGenerator.createSelfSigned({
				signingAlgorithm: alg,
				keys: keyPair,
				name: certData.subject,
				extensions: extensions
			});
			certificate = x509Cert.toString('pem');
		}

		privateKey = await exportPrivateKeyAsPem(keyPair.privateKey);
	}

	async function saveAsPKCS12() {
		const chain: x509.X509Certificate[] = certificate
			.split(new RegExp('\n(?=-----BEGIN CERTIFICATE-----)'))
			.map((cert) => {
				const derBuffer = pemToArrayBuffer(cert);
				return new x509.X509Certificate(derBuffer);
			});
		const pkcs12 = await createPkcs12(keyPair.privateKey, chain, password);
		saveFile(new File([pkcs12], 'certificate.p12'));
	}
</script>

<svelte:head>
	<title>Certificate Tools - Create Certificate</title>
</svelte:head>

<h2>Create Certificate</h2>

<div class="page-container">
	<div class="input-container">
		<div style="display: flex;">
			<button
				style="border-top-right-radius: 0; border-bottom-right-radius: 0; width: 16rem;"
				class:g-active={!useLocalCa}
				onclick={() => (useLocalCa = false)}>
				Self-signed
			</button>
			<button
				style="border-top-left-radius: 0; border-bottom-left-radius: 0; width: 16rem;"
				class:g-active={useLocalCa}
				onclick={() => (useLocalCa = true)}
				title="Use a locally created CA to sign the certificate. The certificate chain will be included in the output.">
				Local CA
			</button>
		</div>
		<CertDataComponent onchange={onCertDataChanged} />
		<button style="width: 100%;" onclick={generateCSR}>Generate Certificate</button>
	</div>
	<div class="output-container">
		<TextOutput
			value={certificate}
			placeholder="PEM encoded certificate will appear here"
			filename="certificate.pem" />
		<TextOutput
			value={privateKey}
			placeholder="Private key (PKCS#8) will appear here"
			filename="private-key.pem" />
		<div>
			<input type="password" bind:value={password} placeholder="Password" />
			<button onclick={saveAsPKCS12} disabled={!certificate || !password}>Save as PKCS#12</button>
		</div>
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
</style>
