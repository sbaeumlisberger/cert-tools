<script lang="ts">
	import TextInput from '$lib/components/text-input.svelte';
	import { formatHex, pemToArrayBuffer } from '$lib/utils/common-utils';
	import { getAlgorithmName } from '$lib/utils/crypto-util';
	import * as x509 from '@peculiar/x509';
	import * as asn1js from 'asn1js';
	import * as pkijs from 'pkijs';

	let input: string = $state('');
	let parsed: string = $state('');

	function parse() {
		parsed = '';
		try {
			if (input.startsWith('-----BEGIN CERTIFICATE-----')) {
				const cert = new x509.X509Certificate(input);
				parsed = cert.toString('text');
			} else if (input.startsWith('-----BEGIN CERTIFICATE REQUEST-----')) {
				const csr = new x509.Pkcs10CertificateRequest(input);
				parsed = csr.toString('text');
			} else if (input.startsWith('-----BEGIN PRIVATE KEY-----')) {
				const asn1 = asn1js.fromBER(pemToArrayBuffer(input));
				const privateKeyInfo = new pkijs.PrivateKeyInfo({ schema: asn1.result });
				parsed = privateKeyInfoToText(privateKeyInfo);
			} else {
				parsed = 'Invalid input. Please provide a valid CSR or certificate.';
			}
		} catch (error: any) {
			parsed = String(error);
		}
	}

	function privateKeyInfoToText(privateKeyInfo: pkijs.PrivateKeyInfo): string {
		return (
			`PKCS#8 Private Key Info: `
			+ `\n  Algorithm: ${getAlgorithmName(privateKeyInfo)}`
			+ `\n  Raw Data: `
			+ `\n    ${formatHex(privateKeyInfo.privateKey.toString('hex'), '    ')}`
			// TODO: key length, curve name, etc.
		);
	}
</script>

<svelte:head>
	<title>Certificate Tools - Decode a CSR or Certificate</title>
</svelte:head>

<h2>Decode a CSR or Certificate</h2>

<div style="display: flex; gap: 2rem; align-items: flex-start; flex-wrap: wrap;">
	<TextInput bind:value={input} placeholder="Paste your CSR or certificate here" />

	<button onclick={parse}>Parse</button>

	<textarea
		cols="65"
		rows={(parsed.match(/\n/g)?.length || 18) + 2}
		style="min-width: 0; resize: none; font-family: monospace; white-space: pre;"
		value={parsed}
		placeholder="Parsed output will appear here"
		readonly></textarea>
</div>
