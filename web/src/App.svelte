<script>
	import { onMount } from "svelte";
	import ListItem from "./ListItem.svelte";

    const url = "http://localhost:3000/repo_releases"

	let releases;

    
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

	h1 {
		font-size: 1.4em;
		margin: 0;
	}
    
	a {
		padding: 2em;
		display: block;
		color: #333;
	}

	.loading {
		opacity: 0;
		animation: 0.4s 0.8s forwards fade-in;
	}

	@keyframes fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	article {
		position: relative;
		padding: 0 0 0 1em;
		border-bottom: 1px solid #eee;
	}

	h2 {
		font-size: 1em;
		margin: 0.5em 0;
	}

	span {
		position: absolute;
		left: 0;
	}

	section {
		margin-top: 4%;
	}
</style>

<main>
<h1>Finnishers!</h1>
<h2>Finnish Github users with >=1 release in a repo</h2>
<section>
{#if releases}
	{#each releases as release}
		<ListItem {release}/>
	{/each}

{:else}
	<p class="loading">loading...</p>
{/if}
</section>
</main>