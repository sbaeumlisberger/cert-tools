<script lang="ts">
	import { base } from '$app/paths';
</script>

<h2>About</h2>

<p>
	This site offers a collection of dev tools especially to create and analyze certificates, CSRs,
	PKCS#12 files and more. Everything runs locally in your web browser using the <a
		href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API">Web Crypto API</a>
	and libraries like <a href="https://peculiarventures.github.io/x509/">@peculiar/x509</a>,
	<a href="https://pkijs.org/">pkijs</a>
	and <a href="https://asn1js.org/">asn1js</a>. No data leaves your computer. The code of this site
	is open source and available on
	<a href="https://github.com/sbaeumlisberger/cert-tools">GitHub</a>.
</p>

<h4>Certificate tools</h4>
<div class="cards-container">
	<a href="{base}/csr">Create CSR</a>
	<a href="{base}/certificate">Create Certificate</a>
	<a href="{base}/sign">Sign Certificate</a>
	<a href="{base}/analyze">Analyze a CSR or Certificate</a>
	<a href="{base}/pkcs12-viewer">View PKCS#12</a>
	<a href="{base}/pkcs12-builder">Create PKCS#12</a>
	<a href="{base}/certificate-bulk">Bulk-create certificates</a>
</div>

<h4>General tools</h4>
<div class="cards-container">
	<a href="{base}/base64">Decode/Encode Base64</a>
	<a href="{base}/json">Format JSON</a>
	<a href="{base}/xml">Format XML</a>
	<a href="{base}/jwt">Parse JWT</a>
	<a href="{base}/timestmap">Parse timestamp</a>
	<a href="{base}/uuid">Generate UUID</a>
	<a href="{base}/svg">Convert SVG to PNG</a>
	<a href="{base}/ico">Convert image to ICO</a>
</div>

<style>
	.cards-container {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(clamp(0px, 100%, 300px), 1fr));
		gap: 1rem;
	}

	.cards-container > a {
		text-decoration: none;
		color: unset;
		padding: 1rem;
		min-height: 80px;
		background: var(--background-color-alt1);
		border-radius: 0.5rem;
		box-shadow: 4px 4px 8px rgb(0 0 0 / 40%);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.cards-container > a:hover {
		background: var(--background-color-alt2);
		cursor: pointer;
	}
</style>
