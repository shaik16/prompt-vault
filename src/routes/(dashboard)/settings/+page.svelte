<script lang="ts">
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';

	let apiKey = $state('');
	let isEditing = $state(false);
	let showKey = $state(false);
	let isSaved = $state(false);
	let copyFeedback = $state(false);

	function toggleEdit() {
		isEditing = !isEditing;
		if (!isEditing) {
			showKey = false;
		}
	}

	function toggleKeyVisibility() {
		showKey = !showKey;
	}

	function handleSave() {
		// Save the API key (client-side only for now)
		isSaved = true;
		isEditing = false;
		showKey = false;

		// Reset the saved feedback after 2 seconds
		setTimeout(() => {
			isSaved = false;
		}, 2000);
	}

	function copyToClipboard() {
		if (apiKey) {
			navigator.clipboard.writeText(apiKey);
			copyFeedback = true;

			// Reset the copy feedback after 2 seconds
			setTimeout(() => {
				copyFeedback = false;
			}, 2000);
		}
	}

	function getMaskedKey(key: string): string {
		if (!key) return '';
		if (key.length <= 4) return '*'.repeat(key.length);
		return key.substring(0, 2) + '*'.repeat(key.length - 4) + key.substring(key.length - 2);
	}
</script>

<div class="space-y-6 p-6">
	<div>
		<h2 class="text-2xl font-bold">Settings</h2>
		<p class="text-sm text-muted-foreground">Manage your account and API keys</p>
	</div>

	<!-- OpenAI API Key Section -->
	<div class="rounded-lg border border-border bg-card p-6">
		<h3 class="mb-4 text-lg font-semibold">OpenAI API Key</h3>

		{#if !isEditing && apiKey}
			<!-- Display Mode -->
			<div class="space-y-4">
				<div class="flex items-center gap-3 rounded-md bg-secondary/50 p-3">
					<input
						type="text"
						value={showKey ? apiKey : getMaskedKey(apiKey)}
						readonly
						class="flex-1 bg-transparent font-mono text-sm outline-none"
					/>
					<button
						onclick={toggleKeyVisibility}
						class="rounded p-1.5 transition-colors hover:bg-secondary"
						title={showKey ? 'Hide key' : 'Show key'}
					>
						{#if showKey}
							<EyeOff class="h-4 w-4" />
						{:else}
							<Eye class="h-4 w-4" />
						{/if}
					</button>
					<button
						onclick={copyToClipboard}
						class="rounded p-1.5 transition-colors hover:bg-secondary"
						title="Copy to clipboard"
					>
						{#if copyFeedback}
							<Check class="h-4 w-4 text-green-500" />
						{:else}
							<Copy class="h-4 w-4" />
						{/if}
					</button>
				</div>

				<div class="flex gap-2">
					<button
						onclick={toggleEdit}
						class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
					>
						Edit
					</button>
				</div>
			</div>
		{:else if isEditing}
			<!-- Edit Mode -->
			<div class="space-y-4">
				<div>
					<label for="api-key" class="mb-2 block text-sm font-medium">API Key</label>
					<input
						id="api-key"
						type={showKey ? 'text' : 'password'}
						bind:value={apiKey}
						placeholder="sk-..."
						class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
					/>
				</div>

				<div class="flex gap-2">
					<button
						onclick={handleSave}
						disabled={!apiKey}
						class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Save
					</button>
					<button
						onclick={toggleEdit}
						class="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
					>
						Cancel
					</button>
				</div>
			</div>
		{:else}
			<!-- Empty State -->
			<div class="space-y-4">
				<p class="text-sm text-muted-foreground">No API key configured yet.</p>
				<button
					onclick={toggleEdit}
					class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
				>
					Add API Key
				</button>
			</div>
		{/if}

		<!-- Success Message -->
		{#if isSaved}
			<div class="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
				✓ API key saved successfully
			</div>
		{/if}
	</div>

	<!-- Additional Settings Section -->
	<div class="rounded-lg border border-border bg-card p-6">
		<h3 class="mb-4 text-lg font-semibold">Account</h3>
		<p class="text-sm text-muted-foreground">
			Manage your account settings and preferences in your profile.
		</p>
	</div>
</div>
