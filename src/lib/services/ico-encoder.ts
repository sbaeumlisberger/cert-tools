import type { IcoImageInfo } from '$lib/models/ico-image-info';

export class IcoEncoder {
	private static readonly HeaderLength = 6;
	private static readonly DirectoryEntryLength = 16;

	private readonly images: IcoImageInfo[] = [];
	private nextImageOffset = 0;
	private chunks: BlobPart[] = [];

	addImage(image: IcoImageInfo): void {
		this.images.push(image);
	}

	commit(): Blob {
		this.chunks = [];
		this.writeHeader();
		this.writeDirectory();
		this.writeImageData();
		return new Blob(this.chunks, { type: 'image/x-icon' });
	}

	private writeHeader(): void {
		this.writeUInt16LE(0);
		this.writeUInt16LE(1);
		this.writeUInt16LE(this.images.length);
	}

	private writeDirectory(): void {
		const directoryLength = this.images.length * IcoEncoder.DirectoryEntryLength;
		this.nextImageOffset = IcoEncoder.HeaderLength + directoryLength;

		for (const image of this.images) {
			this.writeDirectoryEntry(image);
		}
	}

	private writeImageData(): void {
		for (const image of this.images) {
			this.chunks.push(image.imageData);
		}
	}

	private writeDirectoryEntry(image: IcoImageInfo): void {
		this.writeByte(image.width);
		this.writeByte(image.height);
		this.writeByte(image.colorCount);
		this.writeByte(0);
		this.writeUInt16LE(1);
		this.writeUInt16LE(image.bitPerPixel);
		this.writeUInt32LE(image.imageData.size);
		this.writeUInt32LE(this.nextImageOffset);
		this.nextImageOffset += image.imageData.size;
	}

	// --- helpers ---
	private writeByte(value: number): void {
		const buf = new Uint8Array(1);
		buf[0] = value;
		this.chunks.push(buf);
	}

	private writeUInt16LE(value: number): void {
		const buf = new Uint8Array(2);
		new DataView(buf.buffer).setUint16(0, value, true);
		this.chunks.push(buf);
	}

	private writeUInt32LE(value: number): void {
		const buf = new Uint8Array(4);
		new DataView(buf.buffer).setUint32(0, value, true);
		this.chunks.push(buf);
	}
}
