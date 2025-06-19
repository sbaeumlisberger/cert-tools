import { exportPrivateKeyAsPem } from '$lib/utils/utils';
import * as x509 from '@peculiar/x509';

const KEY_ROOT_CA_CERT = 'root-ca-cert';
const KEY_ROOT_CA_PRIVATE_KEY = 'root-ca-private-key';
const KEY_ISSUING_CA_CERT = 'issuing-ca-cert';
const KEY_ISSUING_CA_PRIVATE_KEY = 'issuing-ca-private-key';

const KEY_ALGORITHM = {
    name: 'ECDSA',
    namedCurve: "P-521",
    hash: 'SHA-512'
};

interface Ca {
    cert: x509.X509Certificate;
    privateKey: CryptoKey;
}

export class LocalCa {

    private readonly rootCa: Ca;
    private readonly issuingCa: Ca;

    constructor(rootCa: Ca, issuingCa: Ca) {
        this.rootCa = rootCa;
        this.issuingCa = issuingCa;
    }

    public static async create(): Promise<LocalCa> {
        let rootCa = await loadCa(KEY_ROOT_CA_CERT, KEY_ROOT_CA_PRIVATE_KEY);
        let issuingCa = await loadCa(KEY_ISSUING_CA_CERT, KEY_ISSUING_CA_PRIVATE_KEY);

        let newRootCa = false;

        if (rootCa === null || rootCa.cert.notAfter < new Date()) {
            rootCa = await generateRootCa();
            localStorage.setItem(KEY_ROOT_CA_CERT, rootCa.cert.toString('pem'));
            localStorage.setItem(KEY_ROOT_CA_PRIVATE_KEY, await exportPrivateKeyAsPem(rootCa.privateKey));
            newRootCa = true;
        }

        if (newRootCa || issuingCa === null || issuingCa.cert.notAfter < new Date()) {
            issuingCa = await generateIssuingCa(rootCa);
            localStorage.setItem(KEY_ISSUING_CA_CERT, issuingCa.cert.toString('pem'));
            localStorage.setItem(KEY_ISSUING_CA_PRIVATE_KEY, await exportPrivateKeyAsPem(issuingCa.privateKey));
        }

        return new LocalCa(rootCa, issuingCa);
    }

    public async signCsr(csr: x509.Pkcs10CertificateRequest): Promise<x509.X509Certificate> {
        return await x509.X509CertificateGenerator.create({
            publicKey: csr.publicKey,
            subject: csr.subject,
            extensions: csr.extensions,
            signingKey: this.issuingCa.privateKey,
            signingAlgorithm: KEY_ALGORITHM,
            issuer: this.issuingCa.cert.subject
        });
    }

    public exportRootCa(): string {
        return this.rootCa.cert.toString('pem');
    }

    public exportChain(): string {
        const issuingCaPem = this.issuingCa.cert.toString('pem');
        const rootCaPem = this.rootCa.cert.toString('pem');
        return issuingCaPem + '\n' + rootCaPem;
    }
}

async function loadCa(keyCert: string, keyPrivateKey: string): Promise<Ca | null> {
    const certPem = localStorage.getItem(keyCert);
    const privateKeyPem = localStorage.getItem(keyPrivateKey);
    if (certPem === null || privateKeyPem === null) {
        return null;
    }
    const cert = new x509.X509Certificate(certPem);
    const privateKey = await crypto.subtle.importKey('pkcs8', pemToArrayBuffer(privateKeyPem), KEY_ALGORITHM, true, ['sign']);
    return { cert: cert, privateKey: privateKey };
}

async function generateRootCa(): Promise<Ca> {
    const keys = await crypto.subtle.generateKey(KEY_ALGORITHM, true, ['sign', 'verify'])
    const name = 'Cert Tools Local Root CA';
    const cert = await x509.X509CertificateGenerator.createSelfSigned({
        keys: keys,
        signingAlgorithm: KEY_ALGORITHM,
        name: 'CN=' + name,
        extensions: [
            new x509.BasicConstraintsExtension(true, 0, true),
            new x509.SubjectAlternativeNameExtension([new x509.GeneralName('dns', name)]),
            new x509.KeyUsagesExtension(x509.KeyUsageFlags.digitalSignature | x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign),
        ],
        notAfter: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000), // 10 years
    });
    return { cert: cert, privateKey: keys.privateKey };
}

async function generateIssuingCa(rootCa: Ca): Promise<Ca> {
    const keys = await crypto.subtle.generateKey(KEY_ALGORITHM, true, ['sign', 'verify'])
    const name = 'Cert Tools Local Issuing CA';
    const cert = await x509.X509CertificateGenerator.create({
        publicKey: keys.publicKey,
        subject: 'CN=' + name,
        extensions: [
            new x509.BasicConstraintsExtension(true, 0, true),
            new x509.SubjectAlternativeNameExtension([new x509.GeneralName('dns', name)]),
            new x509.KeyUsagesExtension(x509.KeyUsageFlags.digitalSignature | x509.KeyUsageFlags.keyCertSign | x509.KeyUsageFlags.cRLSign),
        ],
        signingKey: rootCa.privateKey,
        signingAlgorithm: KEY_ALGORITHM,
        issuer: 'CN=' + name,
    });
    return { cert: cert, privateKey: keys.privateKey };
}