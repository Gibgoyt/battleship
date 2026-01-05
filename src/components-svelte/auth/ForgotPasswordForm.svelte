<script>
	import { onMount } from 'svelte';
	import { sendPasswordResetEmail } from 'firebase/auth';
	import { auth } from 'src/lib/firebase/firebase.ts';
	import { createLogger } from 'src/lib/logger.ts';

	const logger = createLogger('ForgotPasswordForm');

	let email = '';
	let loading = false;
	let errorMessage = '';
	let successMessage = '';
	let isSuccessState = false;

	function showError(message) {
		logger.error('Error:', message);
		errorMessage = message;
		successMessage = '';
		isSuccessState = false;
	}

	function showSuccess(message) {
		logger.info('Success:', message);
		successMessage = message;
		errorMessage = '';
		isSuccessState = true;
	}

	function hideMessages() {
		errorMessage = '';
		successMessage = '';
	}

	onMount(() => {
		logger.debug('ForgotPasswordForm mounted, detecting URL parameters');

		try {
			const urlParams = new URLSearchParams(window.location.search);
			const emailParam = urlParams.get('email');

			if (emailParam) {
				email = emailParam;
				logger.debug('Email pre-filled from URL parameter:', emailParam);
			}
		} catch (error) {
			logger.error('Error detecting URL parameters:', error);
		}
	});

	function handleSubmit(e) {
		e.preventDefault();
		logger.debug('Forgot password form submitted!');

		if (!email) {
			showError('Please enter your email address.');
			return;
		}

		// Basic email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			showError('Please enter a valid email address.');
			return;
		}

		sendPasswordReset(email);
	}

	async function sendPasswordReset(email) {
		logger.debug('Starting password reset for:', email);

		if (!auth) {
			showError('Firebase authentication not initialized. Please try again.');
			return;
		}

		loading = true;
		hideMessages();

		try {
			await sendPasswordResetEmail(auth, email);
			logger.info('Password reset email sent successfully');
			showSuccess('Password reset email sent! Check your inbox and follow the instructions to reset your password.');
		} catch (err) {
			logger.error('Password reset failed:', err);

			let errorMsg = '';

			switch (err.code) {
				case 'auth/user-not-found':
					errorMsg = 'No account found with this email address.';
					break;
				case 'auth/invalid-email':
					errorMsg = 'Please enter a valid email address.';
					break;
				case 'auth/too-many-requests':
					errorMsg = 'Too many password reset requests. Please try again later.';
					break;
				case 'auth/network-request-failed':
					errorMsg = 'Network error. Please check your connection and try again.';
					break;
				default:
					errorMsg = err.message || 'Password reset failed. Please try again.';
			}

			showError(errorMsg);
		} finally {
			loading = false;
		}
	}
</script>

<main>
	<!-- Background -->
	<div class="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
		<div class="mb-8">
			<div class="max-w-md w-full space-y-8">
				<!-- Header -->
				<div class="text-center">
					<h2 class="text-3xl font-bold text-gray-900 dark:text-white">
						Reset your password
					</h2>
					<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
						Enter your email address and we'll send you a link to reset your password.
					</p>
				</div>

				<!-- Form -->
				<div class="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 p-8 space-y-6">
					<!-- Error Message -->
					{#if errorMessage}
						<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3">
							{errorMessage}
						</div>
					{/if}

					<!-- Success Message -->
					{#if successMessage}
						<div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3">
							{successMessage}
						</div>
					{/if}

					{#if !isSuccessState}
						<!-- Form -->
						<form on:submit={handleSubmit} class="space-y-6">
							<div>
								<label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Email address
								</label>
								<input
									id="email"
									name="email"
									type="email"
									autocomplete="email"
									required
									bind:value={email}
									disabled={loading}
									class="relative block w-full px-3 py-3 border border-gray-300 dark:border-zinc-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-zinc-700 focus:outline-none focus:ring-[#00d9ff] focus:border-[#00d9ff] focus:z-10 sm:text-sm transition-colors"
									placeholder="Enter your email address"
								/>
							</div>

							<div>
								<button
									type="submit"
									disabled={loading}
									class="w-full flex justify-center items-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium text-white bg-[#00d9ff] hover:bg-[#00b8d4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00d9ff] dark:focus:ring-offset-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{#if loading}
										<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
											<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Sending reset email...
									{:else}
										Send Reset Email
									{/if}
								</button>
							</div>
						</form>
					{:else}
						<!-- Success State -->
						<div class="text-center space-y-4">
							<div>
								<a
									href="/auth/sign-in"
									class="w-full flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium text-white bg-[#00d9ff] hover:bg-[#00b8d4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00d9ff] dark:focus:ring-offset-zinc-800 transition-colors"
								>
									Back to Login
								</a>
							</div>
						</div>
					{/if}

					<!-- Back to Login Link -->
					{#if !isSuccessState}
						<div class="text-center">
							<a href="/auth/sign-in" class="font-medium text-[#00d9ff] hover:text-[#00b8d4] transition-colors">
								Back to Login
							</a>
						</div>
					{/if}
				</div>

				<!-- Sign Up Link -->
				{#if !isSuccessState}
					<div class="text-center">
						<p class="text-sm text-gray-600 dark:text-gray-400">
							Don't have an account?
							<a href="/auth/sign-up" class="font-medium text-[#00d9ff] hover:text-[#00b8d4] transition-colors">
								Sign up
							</a>
						</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</main>