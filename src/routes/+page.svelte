<script lang="ts">
	import { base } from '$app/paths';
</script>

<h2>About</h2>

<p>
	This site offers a collection of dev tools to create and analyze certificates, CSRs, PKCS#12 files
	and more. Everything runs locally in your web browser using the <a
		href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API">Web Crypto API</a>
	and libraries like <a href="https://peculiarventures.github.io/x509/">@peculiar/x509</a>,
	<a href="https://pkijs.org/">pkijs</a>
	and <a href="https://asn1js.org/">asn1js</a>. No data ever leaves your computer. The code of this
	site is open source and available on
	<a href="https://github.com/sbaeumlisberger/cert-tools">GitHub</a>.
</p>

<br />

<div class="cards-container">
	<div><a href="{base}/csr">Create CSR</a></div>
	<div><a href="{base}/certificate">Create Certificate</a></div>
	<div><a href="{base}/sign">Sign Certificate</a></div>
	<div><a href="{base}/analyze">Analyze</a></div>
	<div><a href="{base}/pkcs12-viewer">PKCS#12 Viewer</a></div>
	<div><a href="{base}/pkcs12-builder">PKCS#12 Builder</a></div>
</div>

<style>
	.cards-container {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(clamp(0px, 100%, 300px), 1fr));
		gap: 1rem;
	}

	.cards-container > div {
		padding: 1rem;
		min-height: 80px;
		background: var(--background-color-alt1);
		border-radius: 0.5rem;
		box-shadow: 4px 4px 8px rgb(0 0 0 / 40%);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.cards-container > div:hover {
		background: var(--background-color-alt2);
		cursor: pointer;
	}

	.cards-container > div > a {
		text-decoration: none;
		color: unset;
	}
</style>
