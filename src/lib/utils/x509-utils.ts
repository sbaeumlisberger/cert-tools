export function nameEquals(name1: string, name2: string): boolean {
	const normalize = (dn: string) =>
		dn
			.split(',')
			.map((s) => s.trim().toLowerCase())
			.sort()
			.join(',');

	return normalize(name1) === normalize(name2);
}
