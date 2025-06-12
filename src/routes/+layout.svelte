<script lang="ts">
	import { base } from '$app/paths';
</script>

<div class="header">
	<div class="header-content">
		<a class="app-title-container" href="{base}/">
			<h1 class="app-title">Certificate Tools</h1>
			<div class="app-subtitle">running completely in your browser</div>
		</a>
		<div class="nav">
			<a class="nav-item" href="{base}/csr">Create CSR</a>
			<a class="nav-item" href="{base}/certificate">Create Certificate</a>
			<a class="nav-item" href="{base}/sign">Sign Certificate</a>
			<a class="nav-item" href="{base}/analyze">Analyze</a>
			<a class="nav-item" href="{base}/pkcs12">PKCS#12 Viewer</a>
		</div>
	</div>
</div>

<div class="content">
	<slot />
</div>

<style>
	.header {
		background: lightblue;
	}

	.header-content {
		max-width: 1200px;
		margin: auto;
		display: flex;
		align-items: stretch;
		justify-content: center;
		column-gap: 32px;
		padding-inline: 8px;
		flex-wrap: wrap;
	}

	.app-title-container {
		align-self: center;
		padding-block: 8px;
		text-decoration: none;
		color: unset;
	}

	.app-title {
		text-align: center;
		margin: 0;
	}

	.app-subtitle {
		width: 100%;
		text-align: center;
		opacity: 0.6;
		margin-bottom: 8px;
	}

	.nav {
		flex: 1;
		display: flex;
	}

	@media (max-width: 380px) {
		.nav {
			flex-wrap: wrap;
		}
	}

	.nav-item {
		flex: 1;
		text-align: center;
		align-content: center;
		color: unset;
		text-decoration: none;
		padding: 8px;
	}

	.nav-item:hover {
		background: #00000011;
	}

	.content {
		max-width: 1200px;
		padding-inline: 8px;
		margin: auto;
	}
</style>
