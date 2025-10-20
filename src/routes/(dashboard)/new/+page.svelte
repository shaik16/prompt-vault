<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Check from '@lucide/svelte/icons/check';

	interface PromptForm {
		title: string;
		promptText: string;
		category: string;
	}

	const categories = [
		{ value: 'marketing', label: 'Marketing' },
		{ value: 'code', label: 'Code' },
		{ value: 'creative', label: 'Creative' },
		{ value: 'writing', label: 'Writing' },
		{ value: 'business', label: 'Business' },
		{ value: 'other', label: 'Other' }
	];

	let form: PromptForm = $state({
		title: '',
		promptText: '',
		category: ''
	});

	let errors: Partial<PromptForm> = $state({});
	let isSubmitting = $state(false);
	let showSuccess = $state(false);

	function validateForm(): boolean {
		errors = {};

		if (!form.title.trim()) {
			errors.title = 'Title is required';
		} else if (form.title.length > 100) {
			errors.title = 'Title must be less than 100 characters';
		}

		if (!form.promptText.trim()) {
			errors.promptText = 'Prompt text is required';
		} else if (form.promptText.length > 5000) {
			errors.promptText = 'Prompt text must be less than 5000 characters';
		}

		if (!form.category) {
			errors.category = 'Category is required';
		}

		return Object.keys(errors).length === 0;
	}

	async function handleSubmit() {
		if (!validateForm()) {
			return;
		}

		isSubmitting = true;

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Show success message
			showSuccess = true;

			// Reset form
			form = {
				title: '',
				promptText: '',
				category: ''
			};

			// Redirect after 2 seconds
			setTimeout(() => {
				goto('/');
			}, 2000);
		} catch (error) {
			console.error('Error saving prompt:', error);
		} finally {
			isSubmitting = false;
		}
	}

	function handleCancel() {
		goto('/');
	}
</script>

<div class="min-h-screen bg-background">
	<!-- Header with back button -->
	<div
		class="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
	>
		<div class="flex items-center gap-4 px-4 py-4 sm:px-6">
			<button
				onclick={handleCancel}
				class="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft class="h-4 w-4" />
				<span>Back</span>
			</button>
			<h1 class="text-2xl font-bold">Add a New Prompt</h1>
		</div>
	</div>

	<!-- Form container -->
	<div class="flex justify-center px-4 py-8 sm:px-6">
		<div class="w-full max-w-2xl space-y-6">
			<!-- Success message -->
			{#if showSuccess}
				<div class="flex items-center gap-3 rounded-lg bg-green-50 p-4 text-green-700">
					<Check class="h-5 w-5" />
					<span>Prompt saved successfully! Redirecting...</span>
				</div>
			{/if}

			<!-- Form -->
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="space-y-6"
			>
				<!-- Title field -->
				<div class="space-y-2">
					<label for="title" class="block text-sm font-medium">Title</label>
					<Input
						id="title"
						type="text"
						placeholder="e.g., Marketing Copy Generator"
						bind:value={form.title}
						disabled={isSubmitting}
						class={errors.title ? 'border-destructive' : ''}
					/>
					{#if errors.title}
						<p class="text-xs text-destructive">{errors.title}</p>
					{/if}
					<p class="text-xs text-muted-foreground">
						{form.title.length}/100 characters
					</p>
				</div>

				<!-- Prompt Text field -->
				<div class="space-y-2">
					<label for="prompt-text" class="block text-sm font-medium">Prompt Text</label>
					<Textarea
						id="prompt-text"
						placeholder="Enter your detailed AI prompt here..."
						bind:value={form.promptText}
						disabled={isSubmitting}
						class={`min-h-[200px] resize-none ${errors.promptText ? 'border-destructive' : ''}`}
					/>
					{#if errors.promptText}
						<p class="text-xs text-destructive">{errors.promptText}</p>
					{/if}
					<p class="text-xs text-muted-foreground">
						{form.promptText.length}/5000 characters
					</p>
				</div>

				<!-- Category field -->
				<div class="space-y-2">
					<label for="category" class="block text-sm font-medium">Category</label>
					<Select.Root
						type="single"
						value={form.category}
						onValueChange={(value: string | undefined) => {
							form.category = value || '';
						}}
						disabled={isSubmitting}
					>
						<Select.Trigger id="category" class={errors.category ? 'border-destructive' : ''}>
							<span
								>{form.category
									? categories.find((c) => c.value === form.category)?.label
									: 'Select a category'}</span
							>
						</Select.Trigger>
						<Select.Content>
							{#each categories as category (category.value)}
								<Select.Item value={category.value} label={category.label}>
									{category.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					{#if errors.category}
						<p class="text-xs text-destructive">{errors.category}</p>
					{/if}
				</div>

				<!-- Buttons -->
				<div class="flex gap-3 pt-4">
					<Button type="submit" disabled={isSubmitting} class="flex-1">
						{isSubmitting ? 'Saving...' : 'Save Prompt'}
					</Button>
					<Button
						type="button"
						variant="outline"
						onclick={handleCancel}
						disabled={isSubmitting}
						class="flex-1"
					>
						Cancel
					</Button>
				</div>
			</form>
		</div>
	</div>
</div>
