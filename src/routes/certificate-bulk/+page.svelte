<script lang="ts">
	import {
		disableWhile,
		pickRandom,
		randomInteger,
		randomString,
		randomStringLowerCase
	} from '$lib/utils/common-utils';
	import { exportPrivateKeyAsPem } from '$lib/utils/crypto-util';
	import * as x509 from '@peculiar/x509';

	let amount = $state(100);
	let includePrivateKey = $state('random');
	let maxAmountOfSANs = $state(10);
	let progress = $state(0);

	async function generateCertificates() {
		const directory = await showDirectoryPicker();
		const digits = amount.toString().length;

		progress = 0;
		for (let i = 1; i <= amount; i++) {
			const num = i.toString().padStart(digits, '0');

			const algorithm = getRandomAlgorithm();

			const keyPair = (await crypto.subtle.generateKey(algorithm, true, [
				'sign',
				'verify'
			])) as CryptoKeyPair;

			const extensions: x509.Extension[] = [];

			const numberOfSANs = randomInteger(0, maxAmountOfSANs);
			if (numberOfSANs > 0) {
				extensions.push(createRandomSANsExtension(numberOfSANs));
			}

			const x509Cert = await x509.X509CertificateGenerator.createSelfSigned({
				signingAlgorithm: algorithm,
				keys: keyPair,
				name: `CN=Certificate ${num}`,
				extensions: extensions
			});
			progress = i / amount;

			let pem = x509Cert.toString('pem');

			if (
				includePrivateKey === 'always'
				|| (includePrivateKey === 'random' && randomInteger(0, 1) === 1)
			) {
				pem += '\n' + (await exportPrivateKeyAsPem(keyPair.privateKey));
			}

			await downloadFile(directory, `certificate_${num}.pem`, pem);
		}
	}

	function getRandomAlgorithm(): RsaHashedKeyGenParams | EcKeyGenParams | { name: 'Ed25519' } {
		return pickRandom([
			{
				name: 'RSASSA-PKCS1-v1_5',
				modulusLength: pickRandom([2048, 3072, 4096]),
				publicExponent: new Uint8Array([1, 0, 1]), // 65537
				hash: pickRandom(['SHA-256', 'SHA-384', 'SHA-512'])
			},
			{
				name: 'ECDSA',
				namedCurve: pickRandom(['P-256', 'P-384', 'P-521'])
			},
			{
				name: 'Ed25519'
			}
		]);
	}

	function createRandomSANsExtension(numberOfSANs: number): x509.Extension {
		const sans: x509.GeneralName[] = [];
		for (let i = 0; i < numberOfSANs; i++) {
			const type = pickRandom(['dns', 'dn', 'email', 'ip', 'url', 'guid', 'upn', 'id']);
			const value = randomValueForSanType(type);
			sans.push(new x509.GeneralName(type, value));
		}
		return new x509.SubjectAlternativeNameExtension(sans);
	}

	function randomValueForSanType(type: x509.GeneralNameType): string {
		switch (type) {
			case 'dns':
				return randomDns();
			case 'dn':
				return randomDN();
			case 'email':
				return randomEmail();
			case 'ip':
				return randomIp();
			case 'url':
				return randomUrl();
			case 'guid':
				return randomGuid();
			case 'upn':
				return randomEmail();
			case 'id':
				return randomOid();
		}
	}

	function randomDns() {
		return `${randomStringLowerCase(8)}.example.com`;
	}

	function randomDN() {
		return `CN=${randomString(8)}`;
	}

	function randomEmail() {
		return `${randomStringLowerCase(8)}.${randomStringLowerCase(8)}@example.com`;
	}

	function randomIp(): string {
		return Array.from({ length: 4 }, () => randomInteger(0, 255)).join('.');
	}

	function randomUrl(): string {
		return `https://www.example.com/${randomString(8)}`;
	}

	function randomGuid() {
		return crypto.randomUUID();
	}

	function randomOid(): string {
		const first = randomInteger(0, 2);
		const second = randomInteger(0, 39);
		const rest = Array.from({ length: 3 }, () => randomInteger(0, 999));
		return [first, second, ...rest].join('.');
	}

	async function showDirectoryPicker(): Promise<FileSystemDirectoryHandle | null> {
		if ('showDirectoryPicker' in window) {
			const showDirectoryPicker = window.showDirectoryPicker as (
				options?: unknown
			) => Promise<FileSystemDirectoryHandle>;
			return await showDirectoryPicker({
				id: 'cert-bulk',
				mode: 'readwrite',
				startIn: 'downloads'
			});
		}
		return null;
	}

	async function downloadFile(
		directory: FileSystemDirectoryHandle | null,
		fileName: string,
		fileContent: string
	) {
		if (directory !== null) {
			const file = await directory.getFileHandle(fileName, { create: true });
			const writeable = await file.createWritable();
			await writeable.write(fileContent);
			writeable.close();
		} else {
			const objectUrl = URL.createObjectURL(new Blob([fileContent]));
			const a = document.createElement('a');
			a.href = objectUrl;
			a.download = fileName;
			a.click();
			URL.revokeObjectURL(objectUrl);
		}
	}
</script>

<svelte:head>
	<title>Certificate Tools - Bulk-create certificates</title>
</svelte:head>

<div style="display: flex; flex-direction: column; align-items: start;">
	<h2>Bulk-create certificates</h2>

	<span style="margin-block: 0rem 0.5rem;">Numer of certificates</span>
	<input type="number" bind:value={amount} />

	<span style="margin-block: 1.5rem 0.5rem;">Include private key</span>
	<div>
		<label><input type="radio" value="random" bind:group={includePrivateKey} /> Random </label>
		<label><input type="radio" value="always" bind:group={includePrivateKey} /> Always </label>
		<label><input type="radio" value="never" bind:group={includePrivateKey} /> Never </label>
	</div>

	<span style="margin-block: 1.5rem 0.5rem;">Maximum number of SANs</span>
	<input type="number" bind:value={maxAmountOfSANs} />

	<button style="margin-block: 2rem;" onclick={disableWhile(generateCertificates)}>
		Generate
	</button>

	<span style="margin-block: 0rem 0.5rem;">Progress</span>
	<progress style="width: 100%; max-width: 400px" value={progress}></progress>
</div>
