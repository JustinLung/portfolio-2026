<script lang="ts">
	import type { ExperienceItem } from '../../../../utils/types';
	import Experience from './Experience.svelte';

	let { items }: { items: ExperienceItem[] } = $props();
</script>

<!--
	@component
	Renders a list of work and education experiences.
-->
<section class="experiences">
	<ul class="experiences__list">
		{#each items as item (item.id)}
			<Experience {item} />
		{/each}
	</ul>
	<!-- eslint-disable svelte/no-navigation-without-resolve -- static asset, not a route -->
	<a
		href="/justinlung-cv.pdf"
		class="button button--secondary button--download"
		target="_blank"
		rel="noopener noreferrer"
		data-uisfx-hover="hover"
		data-uisfx="forward">My full work history</a
	>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
</section>

<style>
	.experiences {
		margin-top: 128px;

		.experiences__list {
			display: flex;
			flex-direction: column;
			list-style: none;
			padding: 0;
		}

		.button--download {
			margin-top: 32px;
			margin-inline: auto;
		}
	}
</style>
