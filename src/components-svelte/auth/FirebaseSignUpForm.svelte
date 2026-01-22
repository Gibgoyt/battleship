<script>
	import { onMount } from 'svelte';
	import { createUserWithEmailAndPassword } from 'firebase/auth';
	import { auth } from 'src/lib/firebase/firebase.ts';
	import { createLogger } from 'src/lib/logger.ts';

	const logger = createLogger('FirebaseSignUpForm');

	let email = '';
	let confirmEmail = '';
	let password = '';
	let confirmPassword = '';
	let loading = false;
	let errorMessage = '';
	let successMessage = '';

	// Validation error states
	let emailError = '';
	let passwordError = '';

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

	// Email validation with explicit reactive dependencies
	$: emailsMatch = email && confirmEmail ? email === confirmEmail : true;
	$: emailError = email && confirmEmail && !emailsMatch ? 'Email addresses do not match' : '';

	// Password validation with explicit reactive dependencies
	$: passwordsMatch = password && confirmPassword ? password === confirmPassword : true;
	$: passwordMinLength = password ? password.length >= 6 : true;
	$: passwordError = (() => {
		if (!password || !confirmPassword) return '';
		if (!passwordsMatch) return 'Passwords do not match';
		if (!passwordMinLength) return 'Password must be at least 6 characters';
		return '';
	})();

	// Form validity with explicit reactive dependencies
	$: formValid = email && confirmEmail && password && confirmPassword &&
	              emailsMatch && passwordsMatch && passwordMinLength;

	// Debug validation state changes
	$: {
		logger.debug('Validation state:', {
			email: !!email,
			confirmEmail: !!confirmEmail,
			emailsMatch,
			emailError,
			password: !!password,
			confirmPassword: !!confirmPassword,
			passwordsMatch,
			passwordMinLength,
			passwordError,
			formValid
		});
	}

	function handleSubmit(e) {
		e.preventDefault();
		logger.debug('Form submitted!');

		if (!email || !confirmEmail || !password || !confirmPassword) {
			showError('Please fill in all fields.');
			return;
		}

		if (!formValid) {
			showError('Please fix validation errors before submitting.');
			return;
		}

		createFirebaseAccount(email, password);
	}

	async function createFirebaseAccount(email, password) {
		logger.debug('Starting Firebase account creation for:', email);

		if (!auth) {
			showError('Firebase authentication not initialized. Please try again.');
			return;
		}

		loading = true;
		hideMessages();

		try {
			logger.debug('Creating Firebase user...');
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			const user = userCredential.user;

			logger.info('Firebase user created successfully:', user.uid);

			// Store tokens and check backend user existence
			const storeTokensAsync = async () => {
				try {
					const idToken = await user.getIdToken();
					logger.debug('Firebase ID token retrieved');

					// Import token storage dynamically
					const { storeFirebaseTokens } = await import('src/lib/auth/firebase-token-storage.ts');

					// Store tokens in both localStorage/sessionStorage AND cookies
					storeFirebaseTokens({
						idToken,
						refreshToken: user.refreshToken,
						rememberMe: false // Default for sign-up
					});

					logger.info('Firebase tokens stored successfully');

					// Check if backend user exists
					const backendResponse = await fetch('https://devbackend.splitdo.app:8443/api/users/me', {
						headers: {
							'Authorization': `Bearer ${idToken}`,
							'Content-Type': 'application/json',
							'Origin': 'https://splitdo.app'
						}
					});

					if (backendResponse.status === 404) {
						// Backend user doesn't exist, go to Step 2
						logger.info('Backend user does not exist, redirecting to Step 2');
						showSuccess('Account created! Setting up your profile...');

						setTimeout(() => {
							logger.info('Redirecting to sign-up step 2...');
							window.location.href = '/auth/sign-up?firebaseUserExists=true&backendUserExists=false';
						}, 1000);
					} else if (backendResponse.ok) {
						// Backend user already exists, go directly to app
						logger.info('Backend user exists, redirecting to dashboard');
						showSuccess('Account already set up! Redirecting...');

						setTimeout(() => {
							logger.info('Redirecting to dashboard...');
							window.location.href = '/app/dashboard';
						}, 1000);
					} else {
						logger.warn('Backend user check failed:', backendResponse.status);
						showSuccess('Account created! Setting up your profile...');

						setTimeout(() => {
							logger.info('Redirecting to sign-up step 2 (backend check failed)...');
							window.location.href = '/auth/sign-up?firebaseUserExists=true&backendUserExists=false';
						}, 1000);
					}

				} catch (storageError) {
					logger.error('Failed to store tokens or check backend:', storageError);
					showError('Account created but failed to store session. Please try signing in.');
				}
			};

			// Execute the async function
			storeTokensAsync();

		} catch (err) {
			logger.error('Firebase account creation FAILED:', err);
			loading = false;

			let errorMsg = 'Account creation failed. Please try again.';

			switch (err.code) {
				case 'auth/email-already-in-use':
					errorMsg = 'An account with this email already exists. Try signing in instead.';
					break;
				case 'auth/weak-password':
					errorMsg = 'Password must be at least 6 characters.';
					break;
				case 'auth/invalid-email':
					errorMsg = 'Please enter a valid email address.';
					break;
				case 'auth/operation-not-allowed':
					errorMsg = 'Email/password accounts are not enabled. Please contact support.';
					break;
				case 'auth/network-request-failed':
					errorMsg = 'Network error. Please check your connection and try again.';
					break;
				default:
					errorMsg = err.message || 'Account creation failed. Please try again.';
					break;
			}

			showError(errorMsg);
		}
	}

	onMount(() => {
		logger.debug('FirebaseSignUpForm component mounted');
	});
</script>

<div class="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-20">
	<div class="w-full max-w-md">
		<!-- Header -->
		<div class="text-center mb-10">
			<h1 class="text-4xl sm:text-5xl font-black text-white mb-4">
				Create account
			</h1>
			<p class="text-zinc-500">
				Join SPLITDO and start splitting expenses on Solana
			</p>
		</div>

		<!-- Form Card -->
		<div class="bg-zinc-900 border border-zinc-800 p-8">
			<!-- Error Message -->
			{#if errorMessage}
				<div class="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
					{errorMessage}
				</div>
			{/if}

			<!-- Success Message -->
			{#if successMessage}
				<div class="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
					{successMessage}
				</div>
			{/if}

			<form on:submit={handleSubmit} class="space-y-5">
				<div>
					<label for="email" class="block text-sm font-medium text-zinc-400 mb-2">
						Email
					</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						required
						bind:value={email}
						disabled={loading}
						class="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						placeholder="you@example.com"
					/>
				</div>

				<div>
					<label for="confirm-email" class="block text-sm font-medium text-zinc-400 mb-2">
						Confirm Email
					</label>
					<input
						id="confirm-email"
						name="confirm-email"
						type="email"
						autocomplete="email"
						required
						bind:value={confirmEmail}
						disabled={loading}
						class="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed {emailError ? 'border-red-500' : ''}"
						placeholder="Confirm your email"
					/>
					{#if emailError}
						<p class="mt-2 text-sm text-red-400">{emailError}</p>
					{/if}
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-zinc-400 mb-2">
						Password
					</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="new-password"
						required
						bind:value={password}
						disabled={loading}
						class="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						placeholder="Create a password"
					/>
				</div>

				<div>
					<label for="confirm-password" class="block text-sm font-medium text-zinc-400 mb-2">
						Confirm Password
					</label>
					<input
						id="confirm-password"
						name="confirm-password"
						type="password"
						autocomplete="new-password"
						required
						bind:value={confirmPassword}
						disabled={loading}
						class="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed {passwordError ? 'border-red-500' : ''}"
						placeholder="Confirm your password"
					/>
					{#if passwordError}
						<p class="mt-2 text-sm text-red-400">{passwordError}</p>
					{/if}
				</div>

				<button
					type="submit"
					disabled={loading || !formValid}
					class="w-full py-3 px-4 bg-cyan-500 text-black font-semibold hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
				>
					{#if loading}
						<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Creating account...
					{:else}
						Create Account
					{/if}
				</button>
			</form>
		</div>

		<!-- Sign In Link -->
		<div class="text-center mt-8">
			<p class="text-zinc-500">
				Already have an account?
				<a href="/auth/sign-in" class="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
					Sign in
				</a>
			</p>
		</div>
	</div>
</div>
