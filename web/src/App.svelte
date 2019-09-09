<script>
		function getUsers() {
		return [
			{handle: 'barry', repo: 'github.com/lifechanger'}
		]
	}

	const title = "The Finnish Who Can't Finish";
	const users = getUsers();

	
</script>

<style>
	
</style>

<h1>{title}</h1>
{#await users}
	<h1>Waiting for users!</h1>
{:then data}
	{#each users as user}
		<div>
			<input
				bind:value={user.handle}
			>
		</div>
	{/each}
{/await}
