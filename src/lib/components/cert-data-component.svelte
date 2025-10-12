<script lang="ts">
	import type { CertData } from '$lib/models/cert-data';
	import * as x509 from '@peculiar/x509';

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

<div class="root-container">
	<div class="two-columns">
		<span>Key Type:</span>
		<span>
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
		</span>

		{#if keyAlgorithm === 'ECDSA' || keyAlgorithm === 'RSA'}
			<span>Hash Algorithm:</span>
			<select bind:value={hashAlgorithm}>
				{#each availableHashAlgorithms as hashAlgorithm}
					<option value={hashAlgorithm}>{hashAlgorithm}</option>
				{/each}
			</select>
		{/if}

		<span>Subject Name:</span>
		<input
			type="text"
			style="width: 100%;"
			bind:value={subject}
			placeholder="e.g. CN=Alice, C=Wonderland" />
		<!-- TODO: Add link to https://datatracker.ietf.org/doc/html/rfc1779?-->
	</div>

	<div>
		<div>Subject Alternative Names:</div>
		{#each sans as san, index}
			<div style="padding-block: 0.25rem;">
				<select bind:value={san.type}>
					{#each availableSanTypes as type}
						<option value={type}>{type}</option>
					{/each}
				</select>
				<input type="text" bind:value={san.value} />
				<button onclick={() => sans.splice(index, 1)} aria-label="Remove" title="Remove">
					✖
				</button>
			</div>
		{/each}
		<button style="margin-top: 0.5rem;" onclick={() => sans.push({ type: 'dns', value: '' })}>
			Add SAN
		</button>
	</div>

	<div class="key-usages-container">
		<div class="key-usages-list">
			<span>Key Usages:</span>
			{#each keyUsages as keyUsage}
				<label>
					<input type="checkbox" bind:checked={keyUsage.enabled} />
					{keyUsage.name}
				</label>
			{/each}
		</div>
		<div class="key-usages-spacer"></div>
		<div class="key-usages-list">
			<span>Extended Key Usages:</span>
			{#each extendedKeyUsages as extendedKeyUsage}
				<label>
					<input type="checkbox" bind:checked={extendedKeyUsage.enabled} />
					{extendedKeyUsage.name}
				</label>
			{/each}
		</div>
	</div>
</div>

<style>
	.root-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.two-columns {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 1rem;
		align-items: center;
		justify-items: start;
	}

	.key-usages-container {
		display: flex;
		flex-wrap: wrap;
		row-gap: 1rem;
	}

	.key-usages-spacer {
		flex: 1;
		min-width: 1rem;
		max-width: 4rem;
	}

	.key-usages-list {
		display: flex;
		flex-direction: column;
	}

	.key-usages-list > :first-child {
		margin-bottom: 0.25rem;
	}
</style>
