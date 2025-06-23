import * as x509 from '@peculiar/x509';

export class CertData {
	keyAlgorithm: string = 'ECDSA';
	ecCurve: string = 'P-256';
	rsaKeyLength: number = 2048;
	hashAlgorithm: string = 'SHA-512';
	subject: string = '';
	sans: Array<{ type: x509.GeneralNameType; value: string }> = [];
	keyUsages: Array<{ name: string; flag: x509.KeyUsageFlags | string; enabled: boolean }> = [];
	extendedKeyUsages: Array<{ name: string; value: x509.ExtendedKeyUsage; enabled: boolean }> = [];
}
