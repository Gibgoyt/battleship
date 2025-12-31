<script>
	import { onMount } from 'svelte';
	import { signInWithEmailAndPassword } from 'firebase/auth';
	import { auth } from 'src/lib/firebase/firebase.ts';
	import { createLogger } from 'src/lib/logger.ts';

	const logger = createLogger('SvelteLogin');

	let email = '';
	let password = '';
	let rememberMe = false;
	let loading = false;
	let errorMessage = '';
	let successMessage = '';

	function showError(message) {
		logger.error('Error:', message);
		errorMessage = message;
		successMessage = '';
	}

	function showSuccess(message) {
		logger.info('Success:', message);
		successMessage = message;
		errorMessage = '';
	}

	function hideMessages() {
		errorMessage = '';
		successMessage = '';
	}

	function handleSubmit(e) {
		e.preventDefault();
		logger.debug('Form submitted!');

		if (!email || !password) {
			showError('Please enter both email and password.');
			return;
		}

		signIn(email, password, rememberMe);
	}

	async function signIn(email, password, rememberMe) {
		logger.debug('Starting Firebase sign in for:', email);
		
		if (!auth) {
			showError('Firebase authentication not initialized. Please try again.');
			return;
		}
		
		hideMessages();
		loading = true;

		try {
			logger.debug('Calling signInWithEmailAndPassword...');
			
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			const user = userCredential.user;

			logger.info('Firebase authentication SUCCESS!', {
				userId: user.uid,
				email: user.email,
				emailVerified: user.emailVerified
			});

			// Get the Firebase ID token
			const idToken = await user.getIdToken();
			logger.debug('ID Token received:', {
				hasIdToken: Boolean(idToken),
				tokenLength: idToken ? idToken.length : 0
			});

			// Store tokens using the same pattern as Cognito
			const storeTokensAsync = async () => {
				try {
					logger.debug('Storing Firebase tokens...');
					
					// Import token storage dynamically
					const { storeFirebaseTokens } = await import('src/lib/auth/firebase-token-storage.ts');
					
					// Store tokens in both localStorage/sessionStorage AND cookies
					storeFirebaseTokens({
						idToken,
						refreshToken: user.refreshToken,
						rememberMe
					});
					
					logger.info('Firebase tokens stored successfully');
					
					showSuccess('Login successful! Redirecting...');
					
					// Redirect after short delay
					setTimeout(() => {
						logger.info('Redirecting to dashboard...');
						window.location.href = '/app/dashboard';
					}, 1000);
					
				} catch (storageError) {
					logger.error('Failed to store tokens:', storageError);
					showError('Login successful but failed to store session. Please try again.');
				}
			};
			
			// Execute the async function
			storeTokensAsync();

		} catch (err) {
			logger.error('Firebase authentication FAILED:', err);
			loading = false;

			let errorMsg = 'Login failed. Please try again.';
			
			switch (err.code) {
				case 'auth/user-not-found':
					errorMsg = 'No account found with this email address.';
					break;
				case 'auth/wrong-password':
					errorMsg = 'Incorrect email or password.';
					break;
				case 'auth/invalid-email':
					errorMsg = 'Invalid email address format.';
					break;
				case 'auth/user-disabled':
					errorMsg = 'This account has been disabled.';
					break;
				case 'auth/too-many-requests':
					errorMsg = 'Too many failed attempts. Please try again later.';
					break;
				case 'auth/network-request-failed':
					errorMsg = 'Network error. Please check your connection and try again.';
					break;
				case 'auth/invalid-credential':
					errorMsg = 'Invalid credentials. Please check your email and password.';
					break;
				default:
					errorMsg = err.message || errorMsg;
			}

			showError(errorMsg);
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
						Sign in to SplitDo
					</h2>
					<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
						Welcome back! Split expenses seamlessly on Solana.
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
								class="w-full px-4 py-3 border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00d9ff] focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								placeholder="Enter your email"
							/>
						</div>

						<div>
							<label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								autocomplete="current-password"
								required
								bind:value={password}
								disabled={loading}
								class="w-full px-4 py-3 border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00d9ff] focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								placeholder="Enter your password"
							/>
						</div>

						<div class="flex items-center justify-between">
							<div class="flex items-center">
								<input
									id="remember-me"
									name="remember-me"
									type="checkbox"
									bind:checked={rememberMe}
									disabled={loading}
									class="h-4 w-4 text-[#00d9ff] focus:ring-[#00d9ff] border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700"
								/>
								<label for="remember-me" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
									Remember me
								</label>
							</div>

							<div class="text-sm">
								<a href="/auth/forgot-password" class="font-medium text-[#00d9ff] hover:text-[#00b8d4] transition-colors">
									Forgot your password?
								</a>
							</div>
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
									Signing in...
								{:else}
									Sign In
								{/if}
							</button>
						</div>
					</form>
				</div>

				<!-- Sign Up Link -->
				<div class="text-center">
					<p class="text-sm text-gray-600 dark:text-gray-400">
						Don't have an account?
						<a href="/auth/sign-up" class="font-medium text-[#00d9ff] hover:text-[#00b8d4] transition-colors">
							Sign up
						</a>
					</p>
				</div>
			</div>
		</div>
	</div>
</main>
