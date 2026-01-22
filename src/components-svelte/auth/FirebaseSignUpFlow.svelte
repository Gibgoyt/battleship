<script>
	import { onMount } from 'svelte';
	import { createLogger } from 'src/lib/logger.ts';

	// Import existing components (we'll reuse their complete logic)
	import FirebaseSignUpForm from './FirebaseSignUpForm.svelte';
	import FirebaseSignUpForm_Step2 from './FirebaseSignUpForm_Step2.svelte';

	const logger = createLogger('FirebaseSignUpFlow');

	let currentStep = 1; // Default to Step 1
	let loading = true; // Show loading while detecting URL parameters
	let firebaseUserExists = false;
	let backendUserExists = null;

	onMount(() => {
		logger.debug('FirebaseSignUpFlow component mounted, detecting URL parameters');

		try {
			// Client-side URL parameter detection
			const urlParams = new URLSearchParams(window.location.search);
			firebaseUserExists = urlParams.get('firebaseUserExists') === 'true';
			backendUserExists = urlParams.get('backendUserExists');

			logger.debug('URL parameters detected', {
				firebaseUserExists,
				backendUserExists,
				fullSearch: window.location.search
			});

			// Determine step based on parameters
			if (firebaseUserExists && backendUserExists === 'false') {
				currentStep = 2; // Show backend profile creation
				logger.info('URL parameters indicate Step 2 (backend user creation)');
			} else {
				currentStep = 1; // Show Firebase account creation
				logger.info('Showing Step 1 (Firebase account creation) - default or no valid parameters');
			}

		} catch (error) {
			logger.error('Error detecting URL parameters:', error);
			// Fallback to Step 1 on any error
			currentStep = 1;
		}

		loading = false; // URL detection complete
		logger.debug('URL parameter detection complete', { currentStep });
	});
</script>

{#if loading}
	<!-- Loading state -->
	<div class="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
		<div class="text-center">
			<div class="animate-spin h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-6"></div>
			<p class="text-zinc-500">Loading...</p>
		</div>
	</div>
{:else if currentStep === 1}
	<!-- Step 1: Firebase Account Creation -->
	<FirebaseSignUpForm />
{:else if currentStep === 2}
	<!-- Step 2: Backend User Profile Creation -->
	<FirebaseSignUpForm_Step2 />
{:else}
	<!-- Fallback error state -->
	<div class="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
		<div class="w-full max-w-md text-center">
			<div class="bg-zinc-900 border border-zinc-800 p-8">
				<h2 class="text-2xl font-bold text-white mb-4">Sign Up Error</h2>
				<p class="text-zinc-400 mb-6">
					Something went wrong with the sign-up flow.
				</p>
				<a href="/auth/sign-up" class="inline-block px-6 py-3 bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition-colors">
					Start Over
				</a>
			</div>
		</div>
	</div>
{/if}
