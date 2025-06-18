<script lang="ts">
	import { saveFile } from '$lib/utils';
	import * as forge from 'node-forge';

	let password: string = $state('');
	let entries: { name: string; key: string; certs: string }[] = $state([]);
	let errorMessage: string = $state('');
	let canView: boolean = $state(false);

	let pkcs12FileArrayBuffer: ArrayBuffer;

	function handleFileChange(event: Event) {
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

	function viewPkcs12() {
		entries = [];
		errorMessage = '';
		try {
			const pkcs12Der = forge.util.createBuffer(pkcs12FileArrayBuffer);
			const pkcs12Asn1 = forge.asn1.fromDer(pkcs12Der);
			const pkcs12 = forge.pkcs12.pkcs12FromAsn1(pkcs12Asn1, false, password);
			const bags = pkcs12.safeContents.map((sc) => sc.safeBags).flat();
			let i = 1;
			Object.values(Object.groupBy(bags, (bag) => bag.attributes.localKeyId)).forEach((group) => {
				if (!group) return;
				console.log(group);
				const key = group.find((bag) => bag.key !== undefined)?.key;
				const certs = group.filter((bag) => bag.cert !== undefined);
				entries.push({
					name:
						group.find((bag) => bag.attributes.friendlyName)?.attributes.friendlyName
						|| i.toString(),
					key: key !== undefined ? forge.pki.privateKeyToPem(key) : '',
					certs: certs.map((bag) => forge.pki.certificateToPem(bag.cert!)).join('\n')
				});
				i++;
			});
		} catch (error) {
			console.error(error);
			errorMessage = String(error);
		}
	}
</script>

<h2>PKCS#12 Viewer</h2>

<div style="display: flex; align-items: center; column-gap: 64px; row-gap: 16px; flex-wrap: wrap;">
	<input type="file" accept=".p12,.pfx" onchange={(e) => handleFileChange(e)} />
	<div>
		<span>Password:</span>
		<input type="password" bind:value={password} />
	</div>
	<button onclick={viewPkcs12} disabled={!canView}>Open selected file</button>
</div>

<br />

{#if entries.length > 0}
	<div style="max-width: 100%; overflow-x: auto;">
		<table>
			<thead>
				<tr>
					<th>Entry</th>
					<th>Private Key</th>
					<th></th>
					<th>Certificates</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each entries as entry}
					<tr>
						<td>{entry.name}</td>
						<td style="padding-left: 16px;">
							<textarea cols="65" rows="10" readonly>{entry.key}</textarea>
						</td>
						<td>
							<button
								onclick={() => navigator.clipboard.writeText(entry.key)}
								disabled={entry.key.length === 0}>Copy</button>
							<br />
							<button
								style="margin-top: 4px;"
								onclick={() => saveFile(new File([entry.key], entry.name + '_key.pem'))}
								disabled={entry.key.length === 0}>Save</button>
						</td>
						<td style="padding-left: 16px;">
							<textarea cols="65" rows="10" readonly>{entry.certs}</textarea>
						</td>
						<td>
							<button
								onclick={() => navigator.clipboard.writeText(entry.certs)}
								disabled={entry.certs.length === 0}>Copy</button>
							<br />
							<button
								style="margin-top: 4px;"
								onclick={() => saveFile(new File([entry.certs], entry.name + '_certs.pem'))}
								disabled={entry.certs.length === 0}>Save</button>
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
	}
</style>
