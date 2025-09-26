<script lang="ts">
	import TextOutput from '$lib/components/text-output.svelte';
	import { parsePkcs12 } from '$lib/services/pkcs12';
	import { arrayBufferToPem } from '$lib/utils/common-utils';
	import * as x509 from '@peculiar/x509';
	import * as pkijs from 'pkijs';

	let password: string = $state('');
	let info: string = $state('');
	let entries: { name: string; key: string; certs: string }[] = $state([]);
	let errorMessage: string = $state('');
	let canView: boolean = $state(false);

	let pkcs12FileArrayBuffer: ArrayBuffer;

	function handleFileChange(event: Event) {
		info = '';
		entries = [];
		errorMessage = '';
		canView = true;
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			const file = input.files[0];
			const reader = new FileReader();
			reader.onload = async (e) => {
				pkcs12FileArrayBuffer = e.target?.result as ArrayBuffer;
			};
			reader.readAsArrayBuffer(file);
		}
	}

	async function viewPkcs12() {
		info = '';
		entries = [];
		errorMessage = '';
		try {
			const pkcs12 = await parsePkcs12(pkcs12FileArrayBuffer, password);
			info =
				pkcs12.mac !== undefined
					? `MAC: Hash Algorithm: ${pkcs12.mac.hashAlgorithm}, Iterations: ${pkcs12.mac.iterations}, Salt Length: ${pkcs12.mac?.saltLength}`
					: 'No MAC present';
			pkcs12.entries.forEach((entry) => {
				entries.push({
					name: entry.name,
					key: keyToPEM(entry.key),
					certs: entry.chain.map((cert) => certToPEM(cert)).join('\n')
				});
			});
			return;
		} catch (error) {
			console.error(error);
			errorMessage = String(error);
		}

		function keyToPEM(key: pkijs.PrivateKeyInfo): string {
			const der = key.toSchema().toBER(false);
			return arrayBufferToPem(der, '-----BEGIN PRIVATE KEY-----', '-----END PRIVATE KEY-----');
		}

		function certToPEM(cert: x509.X509Certificate): string {
			return arrayBufferToPem(
				cert.rawData,
				'-----BEGIN CERTIFICATE-----',
				'-----END CERTIFICATE-----'
			);
		}
	}
</script>

<svelte:head>
	<title>Certificate Tools - PKCS#12 Viewer</title>
</svelte:head>

<h2>PKCS#12 Viewer</h2>

<div style="display: flex; align-items: center; column-gap: 4rem; row-gap: 1rem; flex-wrap: wrap;">
	<input type="file" accept=".p12,.pfx" onchange={(e) => handleFileChange(e)} />
	<div>
		<span>Password:</span>
		<input type="password" bind:value={password} />
	</div>
	<button onclick={viewPkcs12} disabled={!canView}>Open selected file</button>
</div>

<br />

<p>{info}</p>

<br />

{#if entries.length > 0}
	<div style="max-width: 100%; overflow-x: auto;">
		<table>
			<thead>
				<tr>
					<th>Entry</th>
					<th>Private Key</th>
					<th>Certificates</th>
				</tr>
			</thead>
			<tbody>
				{#each entries as entry}
					<tr>
						<td>{entry.name}</td>
						<td style="padding-left: 1rem;">
							<TextOutput value={entry.key} filename={entry.name + '_key.pem'} />
						</td>
						<td style="padding-left: 1rem;">
							<TextOutput value={entry.certs} filename={entry.name + '_certs.pem'} />
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

{#if errorMessage}
	<p style="color: red;">{errorMessage}</p>
{/if}

<style>
	td {
		vertical-align: top;
		padding: 0 0 1rem 0;
	}
</style>
