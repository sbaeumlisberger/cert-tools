<script lang="ts">
	import * as x509 from '@peculiar/x509';
	import type { CertData } from './cert-data';

	let { onchange }: { onchange: (certData: CertData) => void } = $props();

	$effect(() => {
		onchange({
			keyAlgorithm: keyAlgorithm,
			ecCurve: curve,
			rsaKeyLength: rsaKeyLength,
			hashAlgorithm: hashAlgorithm,
			subject: subject,
			sans: sans,
			keyUsages: keyUsages,
			extendedKeyUsages: extendedKeyUsages
		});
	});

	const availableKeyAlgorithms: string[] = ['ECDSA', 'Ed25519', 'RSA'];
	let keyAlgorithm: string = $state(availableKeyAlgorithms[0]);

	const availableCurves: string[] = ['P-256', 'P-384', 'P-521'];
	let curve: string = $state(availableCurves[0]);

	const availableHashAlgorithms: string[] = ['SHA-256', 'SHA-384', 'SHA-512'];
	let hashAlgorithm: string = $state(availableHashAlgorithms[0]);

	const availableRsaKeyLengths: number[] = [2048, 3072, 4096];
	let rsaKeyLength: number = $state(availableRsaKeyLengths[0]);

	let subject: string = $state('');

	const availableSanTypes = ['dns', 'dn', 'email', 'ip', 'url', 'guid', 'upn', 'id'];
	let sans = $state([] as Array<{ type: x509.GeneralNameType; value: string }>);

	const keyUsages = Object.entries(x509.KeyUsageFlags)
		.filter((entry) => isNaN(Number(entry[0])))
		.map(([name, flag]) => ({
			name: name,
			flag: flag,
			enabled: false
		}));

	const extendedKeyUsages = Object.entries(x509.ExtendedKeyUsage)
		.filter((entry) => isNaN(Number(entry[0])))
		.map(([name, value]) => ({
			name: name,
			value: value,
			enabled: false
		}));
</script>

<span>Key Type:</span>

<select bind:value={keyAlgorithm}>
	{#each availableKeyAlgorithms as keyAlgorithm}
		<option value={keyAlgorithm}>{keyAlgorithm}</option>
	{/each}
</select>

{#if keyAlgorithm === 'ECDSA'}
	<select bind:value={curve}>
		{#each availableCurves as curve}
			<option value={curve}>{curve}</option>
		{/each}
	</select>
{/if}

{#if keyAlgorithm === 'RSA'}
	<select bind:value={rsaKeyLength}>
		{#each availableRsaKeyLengths as rsaKeyLength}
			<option value={rsaKeyLength}>{rsaKeyLength}</option>
		{/each}
	</select>
{/if}

{#if keyAlgorithm === 'ECDSA' || keyAlgorithm === 'RSA'}
	<br /><br />
	<span>Hash Algorithm:</span>
	<select bind:value={hashAlgorithm}>
		{#each availableHashAlgorithms as hashAlgorithm}
			<option value={hashAlgorithm}>{hashAlgorithm}</option>
		{/each}
	</select>
{/if}

<br /><br />

<span>Subject Name:</span>
<input
	type="text"
	style="width: 200px"
	bind:value={subject}
	placeholder="e.g. CN=Alice, C=Wonderland"
/>
<!-- TODO: Add link to https://datatracker.ietf.org/doc/html/rfc1779?-->

<br /><br />

<div>Subject Alternative Names:</div>
{#each sans as san, index}
	<div style="padding: 4px;">
		<select bind:value={san.type}>
			{#each availableSanTypes as type}
				<option value={type}>{type}</option>
			{/each}
		</select>
		<input type="text" bind:value={san.value} />
		<button onclick={() => sans.splice(index, 1)}>Remove</button>
	</div>
{/each}
<button style="margin: 4px;" onclick={() => sans.push({ type: 'dns', value: '' })}>
	Add SAN
</button>

<br /><br />

<div style="display: flex; gap: 40px;">
	<div>
		<span>Key Usages:</span>
		{#each keyUsages as keyUsage}
			<div>
				<label>
					<input type="checkbox" bind:checked={keyUsage.enabled} />
					{keyUsage.name}
				</label>
			</div>
		{/each}
	</div>
	<div>
		<span>Extended Key Usages:</span>
		{#each extendedKeyUsages as extendedKeyUsage}
			<div>
				<label>
					<input type="checkbox" bind:checked={extendedKeyUsage.enabled} />
					{extendedKeyUsage.name}
				</label>
			</div>
		{/each}
	</div>
</div>
