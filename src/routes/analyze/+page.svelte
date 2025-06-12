<script lang="ts">
	import * as x509 from '@peculiar/x509';
	import * as pkijs from 'pkijs';
	import * as asn1js from 'asn1js';
	import { formatHex, getAlgorithmName, pemToArrayBuffer } from '$lib/utils';

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

<h2>Analyze a CSR or Certificate</h2>

<div style="display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap;">
	<textarea cols="65" rows="20" bind:value={input} placeholder="Paste your CSR or certificate here">
	</textarea>

	<button onclick={parse}>Parse</button>

	<textarea
		cols="65"
		rows={(parsed.match(/\n/g)?.length || 18) + 2}
		style="white-space: pre;"
		value={parsed}
		placeholder="Parsed output will appear here"
		readonly></textarea>
</div>
