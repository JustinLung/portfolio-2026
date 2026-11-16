<script>
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/shared/misc/Seo.svelte';
</script>

<Seo title="Page not found" robots="noindex, follow" />

<section>
	<div class="error-container">
		<h1>404</h1>
		<p>
			I swear this worked on my local machine. The page you’re looking for doesn’t exist (anymore).
		</p>
	</div>
	<a
		href={resolve('/')}
		class="button button--secondary"
		data-uisfx-hover="hover"
		data-uisfx="back"
	>
		Go back to the home page
	</a>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
	}

	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	h1 {
		font-size: 6rem;
		font-weight: 700;
		margin: 0;
		padding: 0;
		line-height: 1;

		@media (--viewport-lg-up) {
			font-size: 12rem;
		}
	}

	p {
		font-size: 1rem;
		max-width: 520px;
		text-align: center;

		@media (--viewport-lg-up) {
			font-size: 1.5rem;
		}
	}
</style>
