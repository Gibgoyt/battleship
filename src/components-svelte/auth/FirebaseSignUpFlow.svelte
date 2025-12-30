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
	<!-- Show minimal loading state while detecting URL parameters (very fast) -->
	<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 px-4">
		<div class="max-w-md w-full text-center">
			<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
				<div class="bg-gradient-to-r from-orange-600 to-teal-600 text-transparent bg-clip-text">
					<h2 class="text-3xl font-bold mb-4">Loading...</h2>
				</div>
				<div class="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
			</div>
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
	<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 px-4">
		<div class="max-w-md w-full text-center">
			<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
				<div class="bg-gradient-to-r from-orange-600 to-teal-600 text-transparent bg-clip-text">
					<h2 class="text-3xl font-bold mb-4">Sign Up Error</h2>
				</div>
				<p class="text-gray-600 dark:text-gray-300 mb-4">
					Something went wrong with the sign-up flow.
				</p>
				<a href="/auth/sign-up" class="inline-block px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
					Start Over
				</a>
			</div>
		</div>
	</div>
{/if}