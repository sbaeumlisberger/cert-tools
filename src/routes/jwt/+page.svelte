<script lang="ts">
	import TextInput from '$lib/components/text-input.svelte';
	import TextOutput from '$lib/components/text-output.svelte';

	let jwt = $state('');
	let key = $state('');
	let parsedJwt = $state('');

	$effect(() => {
		const controller = new AbortController();
		parseJwt(jwt.trim(), key.trim(), controller.signal);
		return () => controller.abort();
	});

	async function parseJwt(jwt: string, key: string, abortSignal: AbortSignal) {
		parsedJwt = '';

		if (jwt.trim().length === 0) {
			return;
		}

		const parts = jwt.split('.');

		if (parts.length !== 3) {
			parsedJwt = 'Invalid JWT format. A JWT must have three parts separated by dots.';
			return;
		}

		try {
			const header = JSON.parse(
				String.fromCharCode(...Uint8Array.fromBase64(parts[0], { alphabet: 'base64url' }))
			);

			const payload = JSON.parse(
				String.fromCharCode(...Uint8Array.fromBase64(parts[1], { alphabet: 'base64url' }))
			);

			const signature = parts[2];
			let signatureValid: string;
			try {
				signatureValid = key
					? (await checkSignature(jwt, header, signature, key))
						? 'Valid'
						: 'Invalid'
					: 'Not verified: no key provided';
			} catch (error) {
				console.error(error);
				signatureValid = `Not verfied: ${String(error)}`;
			}

			if (abortSignal.aborted) {
				return;
			}

			// TODO parse iat, exp, etc.

			parsedJwt = `Header:\n${JSON.stringify(header, null, 2)}\n\nPayload:\n${JSON.stringify(payload, null, 2)}\n\nSignature:\n${signatureValid}`;
		} catch (error) {
			console.error(error);
			parsedJwt = String(error);
		}
	}

	async function checkSignature(
		jwt: string,
		parsedHeader: any,
		signature: string,
		key: string
	): Promise<boolean> {
		const signatureBytes = Uint8Array.fromBase64(signature, { alphabet: 'base64url' });
		const dataToVerify = new TextEncoder().encode(jwt.split('.').slice(0, 2).join('.'));

		if (
			parsedHeader.alg === 'HS256'
			|| parsedHeader.alg === 'HS384'
			|| parsedHeader.alg === 'HS512'
		) {
			const keyBytes = new TextEncoder().encode(key);
			const algorithm = { name: 'HMAC', hash: 'SHA-' + parsedHeader.alg.substring(2) };
			const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, algorithm, false, [
				'verify'
			]);
			return await crypto.subtle.verify(algorithm, cryptoKey, signatureBytes, dataToVerify);
		} else if (
			parsedHeader.alg === 'RS256'
			|| parsedHeader.alg === 'RS384'
			|| parsedHeader.alg === 'RS512'
		) {
			const algorithm = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-' + parsedHeader.alg.substring(2) };
			const cryptoKey = await subjectPublicKeyInfoToCryptoKey(key, algorithm);
			return await crypto.subtle.verify(algorithm, cryptoKey, signatureBytes, dataToVerify);
		} else if (
			parsedHeader.alg === 'ES256'
			|| parsedHeader.alg === 'ES384'
			|| parsedHeader.alg === 'ES512'
		) {
			const algorithm = { name: 'ECDSA', hash: 'SHA-' + parsedHeader.alg.substring(2) };
			const cryptoKey = await subjectPublicKeyInfoToCryptoKey(key, algorithm);
			return await crypto.subtle.verify(algorithm, cryptoKey, signatureBytes, dataToVerify);
		} else if (
			parsedHeader.alg === 'PS256'
			|| parsedHeader.alg === 'PS384'
			|| parsedHeader.alg === 'PS512'
		) {
			const bits = parseInt(parsedHeader.alg.substring(2));
			const algorithm = { name: 'RSA-PSS', hash: 'SHA-' + bits, saltLength: bits / 8 };
			const cryptoKey = await subjectPublicKeyInfoToCryptoKey(key, algorithm);
			return await crypto.subtle.verify(algorithm, cryptoKey, signatureBytes, dataToVerify);
		} else if (parsedHeader.alg === 'EdDSA') {
			const algorithm = { name: 'Ed25519' };
			const cryptoKey = await subjectPublicKeyInfoToCryptoKey(key, algorithm);
			return await crypto.subtle.verify(algorithm, cryptoKey, signatureBytes, dataToVerify);
		} else {
			throw new Error(`Unsupported algorithm: ${parsedHeader.alg}`);
		}
	}

	async function subjectPublicKeyInfoToCryptoKey(
		spki: string,
		algorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams
	): Promise<CryptoKey> {
		const pemHeader = '-----BEGIN PUBLIC KEY-----';
		const pemFooter = '-----END PUBLIC KEY-----';
		const keyBase64 = spki.substring(pemHeader.length, spki.length - pemFooter.length - 1);
		const keyBytes = Uint8Array.fromBase64(keyBase64);
		return await crypto.subtle.importKey('spki', keyBytes, algorithm, false, ['verify']);
	}
</script>

<svelte:head>
	<title>Certificate Tools - JWT</title>
</svelte:head>

<h2>Parse JWT</h2>

<div style="display: flex; gap: 2rem; align-items: flex-start; flex-wrap: wrap;">
	<TextInput placeholder="Paste JWT here" bind:value={jwt} wrap />
	<TextInput placeholder="Paste youe key here (optional)" bind:value={key} wrap />

	<TextOutput title="Parsed JWT" value={parsedJwt} wrap />
</div>
