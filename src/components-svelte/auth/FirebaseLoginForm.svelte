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

<main class="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-20">
	<div class="w-full max-w-md">
		<!-- Header -->
		<div class="text-center mb-10">
			<h1 class="text-4xl sm:text-5xl font-black text-white mb-4">
				Welcome back
			</h1>
			<p class="text-zinc-500">
				Sign in to continue to SPLITDO
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

			<form on:submit={handleSubmit} class="space-y-6">
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
					<label for="password" class="block text-sm font-medium text-zinc-400 mb-2">
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
						class="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						placeholder="Enter your password"
					/>
				</div>

				<div class="flex items-center justify-between">
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							bind:checked={rememberMe}
							disabled={loading}
							class="w-4 h-4 bg-zinc-800 border-zinc-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-zinc-900"
						/>
						<span class="text-sm text-zinc-400">Remember me</span>
					</label>

					<a href="/auth/forgot-password" class="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
						Forgot password?
					</a>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full py-3 px-4 bg-cyan-500 text-black font-semibold hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{#if loading}
						<svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Signing in...
					{:else}
						Sign In
					{/if}
				</button>
			</form>
		</div>

		<!-- Sign Up Link -->
		<div class="text-center mt-8">
			<p class="text-zinc-500">
				Don't have an account?
				<a href="/auth/sign-up" class="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
					Sign up
				</a>
			</p>
		</div>
	</div>
</main>
