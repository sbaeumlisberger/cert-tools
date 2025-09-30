<script lang="ts">
	import { clickAsync as disableWhile, pickRandom, randomInteger } from '$lib/utils/common-utils';
	import { exportPrivateKeyAsPem } from '$lib/utils/crypto-util';
	import * as x509 from '@peculiar/x509';

	let amount = $state(100);
	let progress = $state(0);
	let includePrivateKey = $state('random');

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

			const x509Cert = await x509.X509CertificateGenerator.createSelfSigned({
				signingAlgorithm: algorithm,
				keys: keyPair,
				name: `CN=Certificate ${num}`
				// TODO extensions: extensions
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
		switch (randomInteger(0, 2)) {
			case 0:
				return {
					name: 'RSASSA-PKCS1-v1_5',
					modulusLength: pickRandom([2048, 3072, 4096]),
					publicExponent: new Uint8Array([1, 0, 1]), // 65537
					hash: pickRandom(['SHA-256', 'SHA-384', 'SHA-512'])
				};
			case 1:
				return {
					name: 'ECDSA',
					namedCurve: pickRandom(['P-256', 'P-384', 'P-521'])
				};
			default:
				return { name: 'Ed25519' };
		}
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

<h2>Bulk-create certificates</h2>

<p>Numer of certificates</p>
<input type="number" bind:value={amount} />

<p>Include private key</p>
<label><input type="radio" value="random" bind:group={includePrivateKey} /> Random </label>
<label><input type="radio" value="always" bind:group={includePrivateKey} /> Always </label>
<label><input type="radio" value="never" bind:group={includePrivateKey} /> Never </label>

<br /><br />

<button onclick={disableWhile(generateCertificates)}>Generate</button>

<br /><br />

<p>Progress</p>
<progress style="width: 100%; max-width: 400px" value={progress}></progress>
