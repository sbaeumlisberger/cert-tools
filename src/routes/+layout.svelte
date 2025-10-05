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
				<h1 class="app-title">Certificate & Developer Tools</h1>
				<div class="app-subtitle">running locally in your web browser</div>
			</a>
		</div>

		<div class="github-button-container">
			<script async defer src="https://buttons.github.io/buttons.js"></script>
			<a
				class="github-button"
				href="https://github.com/sbaeumlisberger/cert-tools"
				data-icon="octicon-star"
				data-show-count="true"
				aria-label="Star sbaeumlisberger/cert-tools on GitHub">
				GitHub
			</a>
		</div>

		<button class="toggle-nav-button" on:click={toggleNav}>☰</button>
	</div>
</header>

<div class="body">
	<nav id="nav" class="nav {page.url.pathname === base + '/' ? 'nav-collapsed' : ''}">
		{#each navigation as category}
			<div>
				<div class="nav-category-title">{category.title}</div>
				{#each category.items as item}
					<a
						href={base + item.route}
						class={page.url.pathname === base + item.route ? 'active-nav-item' : ''}
						>{item.label}</a>
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
		display: flex;
		justify-content: space-between;
		align-items: center;
		column-gap: 1rem;
	}

	.title-nav-button-container {
		display: flex;
	}

	.app-title-container {
		flex: 1;
		align-self: flex-start;
		padding-block-start: 0.5rem;
		padding-block-end: 0.75rem;
		text-decoration: none;
		color: unset;
		display: flex;
		flex-direction: column;
		align-items: start;
		gap: 0.25rem;
	}

	.app-title {
		margin: 0;
		line-height: 1.1;
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
		flex: 1;
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

	.nav.nav-collapsed:not(.open) {
		display: none;
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
		border-left: 2px solid transparent;
	}

	.nav a:hover {
		background: #00000044;
	}

	.nav a.active-nav-item {
		border-radius: 0rem 0.5rem 0.5rem 0rem;
		border-left: 2px solid var(--primary-color);
	}

	.main {
		flex: 1;
		padding-inline: 1rem;
		padding-block-end: 1rem;
	}

	@media (max-width: 800px) {
		.github-button-container {
			display: none;
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

		.body {
			flex-direction: column;
		}
	}
</style>
