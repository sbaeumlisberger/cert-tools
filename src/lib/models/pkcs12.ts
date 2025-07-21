import * as x509 from '@peculiar/x509';
import * as pkijs from 'pkijs';

export interface Pkcs12 {
	entries: Pkcs12Entry[];
	mac?: Pkcs12MacInfo;
}

export interface Pkcs12Entry {
	name: string;
	key: pkijs.PrivateKeyInfo;
	chain: x509.X509Certificate[];
}

export interface Pkcs12MacInfo {
	hashAlgorithm: string;
	iterations: number;
	saltLength: number;
}
