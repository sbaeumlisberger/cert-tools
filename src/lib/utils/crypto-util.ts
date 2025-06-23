import * as pkijs from 'pkijs';
import * as asn1js from 'asn1js';
import { arrayBufferToPem, pemToArrayBuffer } from './common-utils';

export async function importPrivateKeyPkcs8(pem: string) {
	const arrayBuffer = pemToArrayBuffer(pem);
	const asn1 = asn1js.fromBER(arrayBuffer);
	const privateKeyInfo = new pkijs.PrivateKeyInfo({ schema: asn1.result });
	const algorithm = determineAlgorithm(privateKeyInfo);
	return await crypto.subtle.importKey('pkcs8', arrayBuffer, algorithm, false, ['sign']);
}

export function getAlgorithmName(privateKeyInfo: pkijs.PrivateKeyInfo) {
	switch (privateKeyInfo.privateKeyAlgorithm.algorithmId) {
		case '1.2.840.113549.1.1.1':
			return 'RSA';
		case '1.2.840.10045.2.1':
			return 'ECDSA';
		case '1.3.101.112':
			return 'Ed25519';
	}
	return privateKeyInfo.privateKeyAlgorithm.algorithmId;
}

function determineAlgorithm(privateKeyInfo: pkijs.PrivateKeyInfo) {
	switch (privateKeyInfo.privateKeyAlgorithm.algorithmId) {
		// RSA
		case '1.2.840.113549.1.1.1':
			return {
				name: 'RSASSA-PKCS1-v1_5',
				hash: 'SHA-256'
			};
		// ECDSA
		case '1.2.840.10045.2.1': {
			const ecKey = privateKeyInfo.parsedKey as pkijs.ECPrivateKey;
			switch (ecKey.namedCurve) {
				case '1.2.840.10045.3.1.7':
					return {
						name: 'ECDSA',
						namedCurve: 'P-256'
					};
				case '1.3.132.0.34':
					return {
						name: 'ECDSA',
						namedCurve: 'P-384'
					};
				case '1.3.132.0.35':
					return {
						name: 'ECDSA',
						namedCurve: 'P-521'
					};
				default:
					throw new Error(`Unsupported curve: ${ecKey.namedCurve}`);
			}
		}
		// Ed25519
		case '1.3.101.112':
			return { name: 'Ed25519' };
		default:
			throw new Error(
				`Unsupported private key algorithm: ${privateKeyInfo.privateKeyAlgorithm.algorithmId}`
			);
	}
}

export async function exportPrivateKeyAsPem(key: CryptoKey): Promise<string> {
	const keyData = await crypto.subtle.exportKey('pkcs8', key);
	return arrayBufferToPem(keyData, '-----BEGIN PRIVATE KEY-----', '-----END PRIVATE KEY-----');
}
