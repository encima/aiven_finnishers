<script>
	export let release;
</script>

<style>
	article {
		position: relative;
		padding: 0 0 0 2em;
		border-bottom: 1px solid #eee;
	}
	
	img.avatar {border-radius: 80%; size: 40px;}

	h2 {
		font-size: 1em;
		margin: 0.5em 0;
	}

	span {
		position: absolute;
		left: 0;
	}

	a {
		color: #333;
	}
</style>

<article>
	<!-- <span><img class='avatar' src={release.avatar_url} alt="Github User Avatar"/></span> -->
	<h2><a target="_blank" href={release.repo_url}>{release.repo_name}</a></h2>
</article>