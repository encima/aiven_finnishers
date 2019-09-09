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
	img {
		width: 3%;
		border-radius: 70%;
	}
</style>

<article>
	<h2><img src={release.avatar_url} alt="Github User Avatar"/><a target="_blank" href={release.release_url}>{release.username} released {release.repo_name}: {release.release_title}</a></h2>
</article>