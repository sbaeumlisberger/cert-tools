import type { CertData } from '$lib/models/cert-data';

export function validateCertData(certData: CertData): boolean {
	if (certData.subject.length > 0 && !certData.subject.includes('=')) {
		alert('Invalid subject name');
		return false;
	}

	if (certData.subject.length === 0 && certData.sans.every((san) => san.value.length === 0)) {
		alert('Subject or SAN is required');
		return false;
	}
	return true;
}
