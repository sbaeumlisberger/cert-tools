import type { Pkcs12, Pkcs12Entry, Pkcs12MacInfo } from '$lib/models/pkcs12';
import { arrayBufferEquals, stringToArrayBuffer } from '$lib/utils/common-utils';
import { nameEquals } from '$lib/utils/x509-utils';
import * as x509 from '@peculiar/x509';
import * as asn1js from 'asn1js';
import * as forge from 'node-forge';
import * as pkijs from 'pkijs';

const DefaultHashAlogrithm = 'SHA-256';
const DefaultKeyDerivationIterationCount = 10_000;
const DefaultEncryptionAlgorithm = 'AES-CBC';
const DefaultEncryptionKeyLength = 256;
const DefaultEncryptionIvLength = 16;

const OID_PKCS8ShroudedKeyBag = '1.2.840.113549.1.12.10.1.2';
const OID_CertBag = '1.2.840.113549.1.12.10.1.3';
const OID_LocalKeyId = '1.2.840.113549.1.9.21';
const OID_FriendlyName = '1.2.840.113549.1.9.20';

export async function createPkcs12(
	privateKey: CryptoKey,
	chain: x509.X509Certificate[],
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
		pbkdf2HashAlgorithm: DefaultHashAlogrithm,
		hmacHashAlgorithm: DefaultHashAlogrithm,
		iterations: DefaultKeyDerivationIterationCount
	});

	return pfx.toSchema().toBER(false);
}

export async function parsePkcs12(
	pkcs12FileBuffer: ArrayBuffer,
	password: string
): Promise<Pkcs12> {
	try {
		return await parsePkcs12WebCrypto(pkcs12FileBuffer, password);
	} catch (error) {
		if (error instanceof Error && error.message.includes('Unknown "contentEncryptionAlgorithm"')) {
			return await parsePkcs12Forge(pkcs12FileBuffer, password);
		}
		throw error;
	}
}

async function parsePkcs12WebCrypto(
	pkcs12FileBuffer: BufferSource,
	password: string
): Promise<Pkcs12> {
	const entries: Pkcs12Entry[] = [];

	const passwordBuffer = stringToArrayBuffer(password);
	const pfx = pkijs.PFX.fromBER(pkcs12FileBuffer);
	await pfx.parseInternalValues({ password: passwordBuffer });

	const authenticatedSafe = pfx.parsedValue!.authenticatedSafe!;
	await authenticatedSafe.parseInternalValues({
		safeContents: authenticatedSafe.safeContents.map((contentInfo) => {
			if (contentInfo.contentType === pkijs.ContentInfo.ENCRYPTED_DATA) {
				return {
					password: passwordBuffer
				};
			} else {
				return {};
			}
		})
	});

	const safeContents: pkijs.SafeContents[] = authenticatedSafe.parsedValue.safeContents.map(
		(entry: { value: pkijs.SafeContent }) => entry.value
	);

	const bags = safeContents.map((sc) => sc.safeBags).flat();

	const certBags = bags
		.filter((bag) => bag.bagId === OID_CertBag)
		.map((bag) => bag as pkijs.SafeBag<pkijs.CertBag>);

	const allCerts = certBags.map((bag) => extractCertFromBag(bag));

	const keyBags = bags
		.filter((bag) => bag.bagId === OID_PKCS8ShroudedKeyBag)
		.map((bag) => bag as pkijs.SafeBag<pkijs.PKCS8ShroudedKeyBag>);

	await Promise.all(
		keyBags.map(async (keyBag, index) => {
			const friendlyName = getFriendlyNameFromBag(keyBag);
			const key = await extractKeyFromBag(keyBag, passwordBuffer);
			const certBag = findCertBagForKeyBag(keyBag, certBags);
			const chain = certBag !== undefined ? buildChain(extractCertFromBag(certBag), allCerts) : [];
			entries.push({
				name: friendlyName ?? `${index + 1}`,
				key: key,
				chain: chain
			});
		})
	);

	return {
		entries: entries,
		mac: extractMacInfo(pfx)
	};
}

async function createSafeContens(
	privateKey: CryptoKey,
	chain: x509.X509Certificate[],
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
		bagId: OID_PKCS8ShroudedKeyBag,
		bagValue: new pkijs.PKCS8ShroudedKeyBag({
			encryptionAlgorithm: keyEncryptedData.encryptedContentInfo.contentEncryptionAlgorithm,
			encryptedData: keyEncryptedData.encryptedContentInfo.encryptedContent
		}),
		bagAttributes: [
			new pkijs.Attribute({
				type: OID_LocalKeyId,
				values: [new asn1js.OctetString({ valueHex: localKeyIdBuffer })]
			})
		]
	});

	const certBags = chain.map(
		(cert) =>
			new pkijs.SafeBag({
				bagId: OID_CertBag,
				bagValue: new pkijs.CertBag({
					parsedValue: new pkijs.Certificate({ schema: asn1js.fromBER(cert.rawData).result })
				})
			})
	);

	certBags[0].bagAttributes = [
		new pkijs.Attribute({
			type: OID_LocalKeyId,
			values: [new asn1js.OctetString({ valueHex: localKeyIdBuffer })]
		})
	];

	return new pkijs.SafeContents({
		safeBags: [keyBag, ...certBags]
	});
}

async function extractKeyFromBag(
	keyBag: pkijs.SafeBag<pkijs.PKCS8ShroudedKeyBag>,
	password: ArrayBuffer
): Promise<pkijs.PrivateKeyInfo> {
	const cmsEncrypted = new pkijs.EncryptedData({
		encryptedContentInfo: new pkijs.EncryptedContentInfo({
			contentEncryptionAlgorithm: keyBag.bagValue.encryptionAlgorithm,
			encryptedContent: keyBag.bagValue.encryptedData
		})
	});
	const decryptedData = await cmsEncrypted.decrypt({ password: password });
	return pkijs.PrivateKeyInfo.fromBER(decryptedData);
}

function extractCertFromBag(bag: pkijs.SafeBag<pkijs.CertBag>): x509.X509Certificate {
	return new x509.X509Certificate(bag.bagValue.parsedValue.toSchema().toBER(false));
}

function getFriendlyNameFromBag(bag: pkijs.SafeBag): string | null {
	if (bag.bagAttributes) {
		return bag.bagAttributes.find((attr) => attr.type === OID_FriendlyName)?.values[0].getValue();
	}
	return null;
}

function getLocalKeyIdFromBag(bag: pkijs.SafeBag): ArrayBuffer | null {
	if (bag.bagAttributes) {
		return bag.bagAttributes.find((attr) => attr.type === OID_LocalKeyId)?.values[0].getValue();
	}
	return null;
}

function findCertBagForKeyBag(
	keyBag: pkijs.SafeBag<pkijs.PKCS8ShroudedKeyBag>,
	certBags: pkijs.SafeBag<pkijs.CertBag>[]
): pkijs.SafeBag<pkijs.CertBag> | undefined {
	const keyLocalKeyId = getLocalKeyIdFromBag(keyBag);
	const keyFriendlyName = getFriendlyNameFromBag(keyBag);

	let localKeyIdMatch = undefined;
	let friendlyNameMatch = undefined;

	certBags.forEach((certBag) => {
		let localKeyIdMatches = false;
		let friendlyNameMatches = false;

		if (keyLocalKeyId != null) {
			const certLocalKeyId = getLocalKeyIdFromBag(certBag);
			if (certLocalKeyId != null && arrayBufferEquals(certLocalKeyId, keyLocalKeyId)) {
				localKeyIdMatches = true;
				localKeyIdMatch ??= certBag;
			}
		}

		if (keyFriendlyName != null) {
			const certFriendlyName = getFriendlyNameFromBag(certBag);
			if (certFriendlyName != null && certFriendlyName === keyFriendlyName) {
				friendlyNameMatches = true;
				friendlyNameMatch ??= certBag;
			}
		}

		if (localKeyIdMatches && friendlyNameMatches) {
			return certBag;
		}
	});

	return localKeyIdMatch ?? friendlyNameMatch;
}

function buildChain(
	cert: x509.X509Certificate,
	allCerts: x509.X509Certificate[]
): x509.X509Certificate[] {
	const chain: x509.X509Certificate[] = [];
	let currentCert: x509.X509Certificate | undefined = cert;
	while (currentCert !== undefined) {
		chain.push(currentCert);
		currentCert = findParentCert(currentCert, allCerts);
	}
	return chain;
}

function findParentCert(
	cert: x509.X509Certificate,
	allCerts: x509.X509Certificate[]
): x509.X509Certificate | undefined {
	const authorityKeyIdentifier = extractAuthorityKeyIdentifier(cert);

	if (authorityKeyIdentifier !== undefined) {
		const subjectKeyIdentifier = extractSubjectKeyIdentifier(cert);

		if (subjectKeyIdentifier !== undefined && subjectKeyIdentifier === authorityKeyIdentifier) {
			return undefined; // self-signed
		}

		const parent = allCerts.find((c) => {
			const subjectKeyIdentifier = extractSubjectKeyIdentifier(c);
			return subjectKeyIdentifier !== undefined && subjectKeyIdentifier === authorityKeyIdentifier;
		});

		if (parent !== undefined) {
			return parent;
		}
	}

	if (nameEquals(cert.subject, cert.issuer)) {
		return undefined; // self-signed
	}

	return allCerts.find((c) => nameEquals(c.subject, cert.issuer));
}

function extractAuthorityKeyIdentifier(cert: x509.X509Certificate): string | undefined {
	return cert.extensions?.find((ext) => ext instanceof x509.AuthorityKeyIdentifierExtension)?.keyId;
}

function extractSubjectKeyIdentifier(cert: x509.X509Certificate): string | undefined {
	return cert.extensions?.find((ext) => ext instanceof x509.SubjectKeyIdentifierExtension)?.keyId;
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
			name: DefaultEncryptionAlgorithm,
			length: DefaultEncryptionKeyLength,
			iv: crypto.getRandomValues(new Uint8Array(DefaultEncryptionIvLength)).buffer
		},
		hmacHashAlgorithm: DefaultHashAlogrithm,
		iterationCount: DefaultKeyDerivationIterationCount
	});
	return encryptedData;
}

async function parsePkcs12Forge(pkcs12FileBuffer: ArrayBuffer, password: string): Promise<Pkcs12> {
	console.debug('Try parsing legacy PKCS#12 file with forge');

	const entries: Pkcs12Entry[] = [];

	const pkcs12Der = forge.util.createBuffer(pkcs12FileBuffer);
	const pkcs12Asn1 = forge.asn1.fromDer(pkcs12Der);
	const pkcs12 = forge.pkcs12.pkcs12FromAsn1(pkcs12Asn1, password);

	const bags = pkcs12.safeContents.map((sc) => sc.safeBags).flat();

	const keyBags = bags.filter((bag) => bag.type == '1.2.840.113549.1.12.10.1.2');
	const certBags = bags.filter((bag) => bag.type === '1.2.840.113549.1.12.10.1.3');

	const allCerts = certBags.map((bag) => toCertificate(bag));

	keyBags.forEach((keyBag, index) => {
		const key = toPrivateKeyInfo(keyBag);
		const localKeyId = keyBag.attributes.localKeyId[0];
		const certBag = certBags.find((certBag) => certBag.attributes.localKeyId?.at(0) === localKeyId);
		const chain = certBag !== undefined ? buildChain(toCertificate(certBag), allCerts) : [];
		const friendlyName = keyBag.attributes.friendlyName?.at(0);
		entries.push({
			name: friendlyName ?? `${index + 1}`,
			key: key,
			chain: chain
		});
	});

	const pfx = pkijs.PFX.fromBER(pkcs12FileBuffer);

	return {
		entries: entries,
		mac: extractMacInfo(pfx)
	};
}

function toPrivateKeyInfo(bag: forge.pkcs12.Bag): pkijs.PrivateKeyInfo {
	const derBytes = forge.asn1.toDer(bag.asn1).getBytes();
	const derBuffer = forge.util.binary.raw.decode(derBytes);
	return new pkijs.PrivateKeyInfo({ schema: asn1js.fromBER(derBuffer).result });
}

function toCertificate(bag: forge.pkcs12.Bag): x509.X509Certificate {
	const derBytes = forge.asn1.toDer(bag.asn1).getBytes();
	const derBuffer = forge.util.binary.raw.decode(derBytes);
	return new x509.X509Certificate(derBuffer);
}

function extractMacInfo(pfx: pkijs.PFX): Pkcs12MacInfo | undefined {
	if (pfx.macData === undefined) {
		return undefined;
	}
	return {
		hashAlgorithm: hashAlgorithmOidToName(pfx.macData?.mac.digestAlgorithm.algorithmId),
		iterations: pfx.macData.iterations ?? 1,
		saltLength: pfx.macData.macSalt.getValue().byteLength
	};
}

function hashAlgorithmOidToName(oid: string): string {
	switch (oid) {
		case '1.3.14.3.2.26':
			return 'SHA-1';
		case '2.16.840.1.101.3.4.2.1':
			return 'SHA-256';
		case '2.16.840.1.101.3.4.2.2':
			return 'SHA-384';
		case '2.16.840.1.101.3.4.2.3':
			return 'SHA-512';
	}
	return oid;
}
