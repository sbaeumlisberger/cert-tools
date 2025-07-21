import { readFile } from 'fs/promises';
import * as pkijs from 'pkijs';
import { expect, test } from 'vitest';
import { parsePkcs12 } from './pkcs12';

pkijs.setEngine('test', globalThis.crypto, globalThis.crypto.subtle);

test('parse PKCS#12 created by cert-tools', async () => {
	const pkcs12FileBuffer = new Uint8Array(await readFile('test/pkcs12-test/cert-tools.p12')).buffer;
	const password = 'test';

	const parsed = await parsePkcs12(pkcs12FileBuffer, password);

	expect(parsed.mac?.hashAlgorithm).toBe('SHA-256');
	expect(parsed.entries).lengthOf(1);
	expect(parsed.entries[0].name).toBe('1');
	expect(parsed.entries[0].key).toBeDefined();
	expect(parsed.entries[0].chain.length).toBe(3);
});

test('parse PKCS#12 created by OpenSSL', async () => {
	const pkcs12FileBuffer = new Uint8Array(await readFile('test/pkcs12-test/openssl.p12')).buffer;
	const password = 'test';

	const parsed = await parsePkcs12(pkcs12FileBuffer, password);

	expect(parsed.mac?.hashAlgorithm).toBe('SHA-256');
	expect(parsed.entries.length).toBe(1);
	expect(parsed.entries[0].name).toBe('1');
	expect(parsed.entries[0].key).toBeDefined();
	expect(parsed.entries[0].chain.length).toBe(3);
});

test('parse PKCS#12 with friendlyname', async () => {
	const pkcs12FileBuffer = new Uint8Array(await readFile('test/pkcs12-test/friendlyname.p12'))
		.buffer;
	const password = 'test';

	const parsed = await parsePkcs12(pkcs12FileBuffer, password);

	expect(parsed.mac?.hashAlgorithm).toBe('SHA-256');
	expect(parsed.entries.length).toBe(1);
	expect(parsed.entries[0].name).toBe('test-friendlyname');
	expect(parsed.entries[0].key).toBeDefined();
	expect(parsed.entries[0].chain.length).toBe(3);
});

test('parse PKCS#12 where chain is build via Subject / Authority Key Identifiers', async () => {
	const pkcs12FileBuffer = new Uint8Array(await readFile('test/pkcs12-test/ski-aki-chain.p12'))
		.buffer;
	const password = 'test';

	const parsed = await parsePkcs12(pkcs12FileBuffer, password);

	expect(parsed.mac?.hashAlgorithm).toBe('SHA-256');
	expect(parsed.entries.length).toBe(1);
	expect(parsed.entries[0].name).toBe('1');
	expect(parsed.entries[0].key).toBeDefined();
	expect(parsed.entries[0].chain.length).toBe(3);
});

test('parse PKCS#12 encrypted with Triple DES and RC2 (legacy)', async () => {
	const pkcs12FileBuffer = new Uint8Array(await readFile('test/pkcs12-test/legacy.p12')).buffer;
	const password = 'test';

	const parsed = await parsePkcs12(pkcs12FileBuffer, password);

	expect(parsed.mac?.hashAlgorithm).toBe('SHA-1');
	expect(parsed.entries.length).toBe(1);
	expect(parsed.entries[0].name).toBe('1');
	expect(parsed.entries[0].key).toBeDefined();
	expect(parsed.entries[0].chain.length).toBe(3);
});

test('parse PKCS#12 encrypted with Triple DES and RC2 (legacy) with friendlyname', async () => {
	const pkcs12FileBuffer = new Uint8Array(
		await readFile('test/pkcs12-test/legacy-with-friendlyname.p12')
	).buffer;
	const password = 'test';

	const parsed = await parsePkcs12(pkcs12FileBuffer, password);

	expect(parsed.mac?.hashAlgorithm).toBe('SHA-1');
	expect(parsed.entries.length).toBe(1);
	expect(parsed.entries[0].name).toBe('test-friendlyname');
	expect(parsed.entries[0].key).toBeDefined();
	expect(parsed.entries[0].chain.length).toBe(3);
});
