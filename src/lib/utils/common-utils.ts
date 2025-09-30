export function pemToBase64(pem: string): string {
	return pem.replace(/-----.*?-----/g, '').replace(/\s/g, '');
}

export function base64StringToArrayBuffer(base64: string): ArrayBuffer {
	return Uint8Array.fromBase64(base64).buffer;
}

export function stringToArrayBuffer(str: string): ArrayBuffer {
	return Uint8Array.from(str, (c) => c.charCodeAt(0)).buffer;
}

export function arrayBufferToBase64String(arrayBuffer: ArrayBuffer): string {
	return new Uint8Array(arrayBuffer).toBase64();
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
		const objectUrl = URL.createObjectURL(file);
		const a = document.createElement('a');
		a.href = objectUrl;
		a.download = file.name;
		a.click();
		URL.revokeObjectURL(objectUrl);
	}
}

export function arrayBufferEquals(buffer1: ArrayBuffer, buffer2: ArrayBuffer) {
	if (buffer1.byteLength !== buffer2.byteLength) {
		return false;
	}

	const view1 = new Uint8Array(buffer1);
	const view2 = new Uint8Array(buffer2);

	for (let i = 0; i < view1.length; i++) {
		if (view1[i] !== view2[i]) {
			return false;
		}
	}

	return true;
}

export function randomInteger(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickRandom<T>(array: T[]) {
	return array[randomInteger(0, array.length - 1)];
}

export function clickAsync(asyncFunction: () => Promise<void>) {
	return async (event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => {
		const button = event.currentTarget;
		try {
			button.disabled = true;
			await asyncFunction();
		} finally {
			button.disabled = false;
		}
	};
}
