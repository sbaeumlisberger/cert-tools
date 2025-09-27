export class IcoImageInfo {
	/**
	 * The image data, either in BITMAPINFOHEADER format or as PNG.
	 */
	readonly imageData: Blob;

	/**
	 * Width in pixels, should be 0 if 256 pixels.
	 */
	readonly width: number;

	/**
	 * Height in pixels, should be 0 if 256 pixels.
	 */
	readonly height: number;

	/**
	 * Color count, should be 0 if more than 256 colors.
	 */
	readonly colorCount: number;

	/**
	 * Bits per pixel.
	 */
	readonly bitPerPixel: number;

	constructor(
		imageData: Blob,
		width: number,
		height: number,
		colorCount: number,
		bitPerPixel: number
	) {
		this.imageData = imageData;
		this.width = width;
		this.height = height;
		this.colorCount = colorCount;
		this.bitPerPixel = bitPerPixel;
	}
}
