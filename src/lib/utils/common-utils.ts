export function pemToBase64(pem: string): string {
	return pem.replace(/-----.*?-----/g, '').replace(/\s/g, '');
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

export function arrayBufferToPem(arrayBuffer: ArrayBuffer, begin: string, end: string): string {
	const base64 = arrayBufferToBase64String(arrayBuffer);
	return begin + '\n' + base64.match(/.{1,64}/g)?.join('\n') + '\n' + end;
}

export function formatHex(hex: string, indent: string = ''): string {
	return hex
		.replace(/(.{32})/g, '$1\n' + indent)
		.replace(/(\S{16})(?!\s)/g, '$1  ')
		.replace(/(\S{2})(?!\s)/g, '$1 ');
}

export async function saveFile(file: File) {
	if ('showSaveFilePicker' in window) {
		const saveFilePicker = window.showSaveFilePicker as (
			options?: unknown
		) => Promise<FileSystemFileHandle>;
		const fileHandle = await saveFilePicker({ suggestedName: file.name });
		const writable = await fileHandle.createWritable();
		await writable.write(file);
		await writable.close();
	} else {
		const a = document.createElement('a');
		a.href = URL.createObjectURL(file);
		a.download = file.name;
		a.click();
	}
}
