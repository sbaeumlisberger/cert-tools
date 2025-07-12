import * as pkijs from 'pkijs';
import * as asn1js from 'asn1js';

export async function createPkcs12(
	privateKey: CryptoKey,
	chain: pkijs.Certificate[],
	password: string
): Promise<ArrayBuffer> {
	const passwordBuffer = stringToArrayBuffer(password);

	const safeContents = await createSafeContens(privateKey, chain, passwordBuffer);

	const authenticatedSafe = new pkijs.AuthenticatedSafe({
		safeContents: [
			new pkijs.ContentInfo({
				contentType: pkijs.ContentInfo.DATA,
				content: new asn1js.OctetString({ valueHex: safeContents.toSchema().toBER(false) })
			})
		]
	});

	const pfx = new pkijs.PFX({
		version: 3,
		parsedValue: {
			integrityMode: 0, // Password-Based Integrity Mode
			authenticatedSafe: authenticatedSafe
		}
	});

	await pfx.makeInternalValues({
		password: passwordBuffer,
		pbkdf2HashAlgorithm: 'SHA-256',
		hmacHashAlgorithm: 'SHA-256',
		iterations: 10_000
	});

	return pfx.toSchema().toBER(false);
}

async function createSafeContens(
	privateKey: CryptoKey,
	chain: pkijs.Certificate[],
	passwordBuffer: ArrayBuffer
): Promise<pkijs.SafeContents> {
	const localKeyIdBuffer = crypto.getRandomValues(new Uint8Array(4)).buffer;

	const privateKeyPkcs8 = await crypto.subtle.exportKey('pkcs8', privateKey);
	const privateKeyInfo = new pkijs.PrivateKeyInfo({
		schema: asn1js.fromBER(privateKeyPkcs8).result
	});

	const keyEncryptedData = await createEncryptedData(
		privateKeyInfo.toSchema().toBER(false),
		passwordBuffer
	);

	const keyBag = new pkijs.SafeBag({
		bagId: '1.2.840.113549.1.12.10.1.2',
		bagValue: new pkijs.PKCS8ShroudedKeyBag({
			encryptionAlgorithm: keyEncryptedData.encryptedContentInfo.contentEncryptionAlgorithm,
			encryptedData: keyEncryptedData.encryptedContentInfo.encryptedContent
		}),
		bagAttributes: [
			new pkijs.Attribute({
				type: '1.2.840.113549.1.9.21', // localKeyId
				values: [new asn1js.OctetString({ valueHex: localKeyIdBuffer })]
			})
		]
	});

	const certBags = chain.map(
		(cert) =>
			new pkijs.SafeBag({
				bagId: '1.2.840.113549.1.12.10.1.3',
				bagValue: new pkijs.CertBag({
					parsedValue: cert
				})
			})
	);

	certBags[0].bagAttributes = [
		new pkijs.Attribute({
			type: '1.2.840.113549.1.9.21', // localKeyId
			values: [new asn1js.OctetString({ valueHex: localKeyIdBuffer })]
		})
	];

	return new pkijs.SafeContents({
		safeBags: [keyBag, ...certBags]
	});
}

async function createEncryptedData(
	contentToEncrypt: ArrayBuffer,
	passwordBuffer: ArrayBuffer
): Promise<pkijs.EncryptedData> {
	const encryptedData = new pkijs.EncryptedData();
	await encryptedData.encrypt({
		contentToEncrypt: contentToEncrypt,
		password: passwordBuffer,
		contentEncryptionAlgorithm: {
			name: 'AES-CBC',
			length: 256,
			iv: crypto.getRandomValues(new Uint8Array(16)).buffer
		},
		hmacHashAlgorithm: 'SHA-256',
		iterationCount: 10_000
	});
	return encryptedData;
}

function stringToArrayBuffer(str: string): ArrayBuffer {
	const stringLength = str.length;

	const resultBuffer = new ArrayBuffer(stringLength);
	const resultView = new Uint8Array(resultBuffer);

	for (let i = 0; i < stringLength; i++) {
		resultView[i] = str.charCodeAt(i);
	}

	return resultBuffer;
}
