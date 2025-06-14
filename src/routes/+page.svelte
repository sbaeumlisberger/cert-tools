<script lang="ts">
	import { base } from '$app/paths';
</script>

<h2>About</h2>

<p>
	This site offers a collection of dev tools to create and analyze certificates, CSRs, PKCS#12 files
	and more. Everything runs locally in your web browser using the Web Crypto API and libraries like
	@peculiar/x509 and node-forge. No data ever leaves your computer. The code of this site is open
	source and available on
	<a href="https://github.com/sbaeumlisberger/cert-tools">GitHub</a>.
</p>

<p>Get started:</p>

<ul>
	<li><a class="nav-item" href="{base}/csr">Create CSR</a></li>
	<li><a class="nav-item" href="{base}/certificate">Create Certificate</a></li>
	<li><a class="nav-item" href="{base}/sign">Sign Certificate</a></li>
	<li><a class="nav-item" href="{base}/analyze">Analyze</a></li>
	<li><a class="nav-item" href="{base}/pkcs12">PKCS#12 Viewer</a></li>
</ul>
