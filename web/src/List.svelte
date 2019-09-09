<script>
	import { onMount } from "svelte";
	import Summary from "./Summary.svelte";

    const url = "http://localhost:3000/repo_releases"

	export let page;

	let releases;
	let offset;

    
    onMount(function() {
        fetch(url)
		.then(r => r.json())
		.then(data => {
			releases = data;
			window.scrollTo(0, 0);
		});
    });
	    
</script>

<style>
	main {
		position: relative;
		max-width: 800px;
		margin: 0 auto;
		min-height: 101vh;
		padding: 1em;
	}

	main :global(.meta) {
		color: #999;
		font-size: 12px;
		margin: 0 0 1em 0;
	}

	main :global(a) {
		color: rgb(0,0,150);
	}
    
	a {
		padding: 2em;
		display: block;
	}

	.loading {
		opacity: 0;
		animation: 0.4s 0.8s forwards fade-in;
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}
</style>

{#if releases}
	{#each releases as item, i}
		<Summary {item} {i} {offset}/>
	{/each}

{:else}
	<p class="loading">loading...</p>
{/if}