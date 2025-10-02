<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { navigation } from '$lib/navigation';

	afterNavigate(() => {
		document.getElementById('nav')!.classList.remove('open');
	});

	function toggleNav() {
		document.getElementById('nav')!.classList.toggle('open');
	}
</script>

<header class="header">
	<div class="header-content">
		<div class="title-nav-button-container">
			<a class="app-title-container" href="{base}/">
				<h1 class="app-title">Certificate & Dev Tools</h1>
				<div class="app-subtitle">running completely in your web browser</div>
			</a>
		</div>
		<button class="toggle-nav-button" on:click={toggleNav}>☰</button>
	</div>
</header>

<div class="body">
	<nav id="nav" class="nav" hidden={page.url.pathname === base + '/'}>
		{#each navigation as category}
			<div>
				<div class="nav-category-title">{category.title}</div>
				{#each category.items as item}
					<a href="{base}{item.route}">{item.label}</a>
				{/each}
			</div>
		{/each}
	</nav>
	<main class="main">
		<slot />
	</main>
</div>

<style>
	.header {
		grid-area: header;
		background: var(--primary-color);
		color: white;
		display: flex;
		justify-content: center;
	}

	.header-content {
		flex: 1;
		max-width: 1500px;
		padding-inline: 1rem;
		padding-block: 0.5rem;
		display: flex;
		justify-content: space-between;
		column-gap: 1rem;
	}

	.title-nav-button-container {
		display: flex;
	}

	.app-title-container {
		flex: 1;
		align-self: flex-start;
		padding-block: 0.5rem;
		text-decoration: none;
		color: unset;
		display: flex;
		flex-direction: row;
		align-items: center;
		column-gap: 2rem;
		flex-wrap: wrap;
	}

	.app-title {
		margin: 0;
	}

	.app-subtitle {
		margin: 0;
		opacity: 0.8;
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

	.body {
		width: 100%;
		max-width: 1500px;
		height: 100%;
		margin: auto;
		display: flex;
		flex-direction: row;
		gap: 1rem;
	}

	.nav {
		flex: 1;
		max-width: 280px;
		padding-block: 1.5rem;
		padding-inline: 1rem;
		background: var(--background-color-alt1);
		box-shadow: 1px 1px 4px rgb(0 0 0 / 40%);
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.nav-category-title {
		padding-inline: 0.25rem;
		margin-bottom: 0.5rem;
		font-size: 1.2rem;
		font-weight: bold;
	}

	.nav a {
		display: block;
		width: 100%;
		color: unset;
		text-decoration: none;
		padding-block: 0.5rem;
		padding-inline: 0.75rem;
		border-radius: 0.5rem;
	}

	.nav a:hover {
		background: #00000044;
	}

	.main {
		flex: 1;
		margin-inline: 1rem;
	}

	@media (max-width: 800px) {
		.body {
			flex-direction: column;
		}

		.toggle-nav-button {
			display: block;
		}

		.nav:not(.open) {
			display: none;
		}

		.nav {
			max-width: unset;
			flex-direction: row;
			flex-wrap: wrap;
		}

		.nav > * {
			flex: 1;
			min-width: 160px;
		}
	}
</style>
