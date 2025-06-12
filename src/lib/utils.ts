import * as pkijs from 'pkijs';
import * as asn1js from 'asn1js';

export function pemToBase64(pem: string): string {
    return pem.replace(/-----.*?-----/g, '').replace(/\s/g, '')
}

export function base64StringToArrayBuffer(base64: string): ArrayBuffer {
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
}

export function stringToArrayBuffer(str: string): ArrayBuffer {
    return Uint8Array.from(str, (c) => c.charCodeAt(0)).buffer;
}

export function arrayBufferToBase64String(arrayBuffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
}

export function pemToArrayBuffer(pem: string): ArrayBuffer {
    const base64 = pemToBase64(pem);
    return base64StringToArrayBuffer(base64);
}

export function arrayBufferToPem(arrayBuffer: ArrayBuffer, begin: string, end: string,): string {
    const base64 = arrayBufferToBase64String(arrayBuffer);
    return begin + "\n" + base64.match(/.{1,64}/g)?.join('\n') + "\n" + end
}

export function formatHex(hex: string, indent: string = ''): string {
    return hex
        .replace(/(.{32})/g, '$1\n' + indent)
        .replace(/(\S{16})(?!\s)/g, '$1  ')
        .replace(/(\S{2})(?!\s)/g, '$1 ');
}

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
            throw new Error(`Unsupported private key algorithm: ${privateKeyInfo.privateKeyAlgorithm.algorithmId}`);
    }
}

export async function saveFile(file: File) {
    if ('showSaveFilePicker' in window) {
        const saveFilePicker = window.showSaveFilePicker as (options?: unknown) => Promise<FileSystemFileHandle>;
        const fileHandle = await saveFilePicker({ suggestedName: file.name, });
        const writable = await fileHandle.createWritable();
        await writable.write(file);
        await writable.close();
    }
    else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(file);
        a.download = file.name;
        a.click();
    }
}