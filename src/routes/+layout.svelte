<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { base } from '$app/paths';

	afterNavigate(() => {
		document.getElementById('nav')!.classList.remove('open');
	});

	function toggleNav() {
		document.getElementById('nav')!.classList.toggle('open');
	}
</script>

<div class="header">
	<div class="header-content">
		<div class="title-nav-button-container">
			<a class="app-title-container" href="{base}/">
				<h1 class="app-title">Certificate Tools</h1>
				<div class="app-subtitle">running completely in your browser</div>
			</a>
			<button class="toggle-nav-button" on:click={toggleNav}>☰</button>
		</div>
		<div id="nav" class="nav">
			<a class="nav-item" href="{base}/csr">Create CSR</a>
			<a class="nav-item" href="{base}/certificate">Create Certificate</a>
			<a class="nav-item" href="{base}/sign">Sign Certificate</a>
			<a class="nav-item" href="{base}/analyze">Analyze</a>
			<a class="nav-item" href="{base}/pkcs12-viewer">PKCS#12 Viewer</a>
			<a class="nav-item" href="{base}/pkcs12-builder">PKCS#12 Builder</a>
		</div>
	</div>
</div>

<div class="content">
	<slot />
</div>

<style>
	.header {
		background: var(--primary-color);
		color: white;
	}

	.header-content {
		max-width: 1240px;
		margin: auto;
		display: flex;
		align-items: stretch;
		justify-content: center;
		column-gap: 1rem;
		padding-inline: 1rem;
		flex-wrap: wrap;
	}

	.title-nav-button-container {
		display: flex;
	}

	.app-title-container {
		flex: 1;
		align-self: center;
		padding-block: 0.5rem;
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
		opacity: 0.8;
		margin-bottom: 0.5rem;
	}

	.toggle-nav-button {
		background: transparent;
		font-size: 2rem;
		border: none;
		display: none;
	}

	.toggle-nav-button:hover {
		background: #00000011;
	}

	.toggle-nav-button:focus-visible {
		outline: white 1px solid;
	}

	.nav {
		flex: 1;
		display: flex;
	}

	@media (max-width: 600px) {
		.header-content {
			flex-direction: column;
		}

		.nav {
			flex-direction: column;
		}

		.nav:not(.open) {
			display: none;
		}

		.toggle-nav-button {
			display: block;
		}
	}

	.nav-item {
		flex: 1;
		text-align: center;
		align-content: center;
		color: unset;
		text-decoration: none;
		padding: 0.5rem;
	}

	.nav-item:hover {
		background: #00000011;
	}

	.content {
		max-width: 1240px;
		padding-inline: 1rem;
		padding-bottom: 1rem;
		margin: auto;
	}
</style>
