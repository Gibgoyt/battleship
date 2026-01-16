<script>
	import { onMount } from 'svelte';
	import { createLogger } from 'src/lib/logger.ts';

	const logger = createLogger('FirebaseSignUpForm_Step2');

	let username = '';
	let bio = '';
	let currency = 'USD';
	let loading = false;
	let errorMessage = '';
	let successMessage = '';
	let firebaseEmail = '';

	// Validation error states
	let usernameError = '';
	let bioError = '';

	const currencies = [
		{ code: 'USD', name: 'US Dollar', symbol: '$' },
		{ code: 'EUR', name: 'Euro', symbol: '€' },
		{ code: 'GBP', name: 'British Pound', symbol: '£' }
	];

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

	// Bio sanitization (user requirements: only [a-zA-Z0-9.,?!#@] and safe chars)
	function sanitizeBio(text) {
		return text
			.replace(/[^a-zA-Z0-9.,?!#@\s]/g, '') // Only allow specified chars
			.substring(0, 100); // Max 100 chars
	}

	// Bio validation with explicit reactive dependencies
	$: bioValid = bio.length <= 100 && /^[a-zA-Z0-9.,?!#@\s]*$/.test(bio);
	$: bioError = (() => {
		if (bio.length > 100) return 'Bio must be 100 characters or less';
		if (!/^[a-zA-Z0-9.,?!#@\s]*$/.test(bio)) return 'Bio contains invalid characters';
		return '';
	})();

	// Username validation with explicit reactive dependencies
	$: usernameValid = username ?
		(username.trim().length >= 3 &&
		 username.trim().length <= 50 &&
		 /^[a-zA-Z0-9_-]+$/.test(username.trim())) : true;

	$: usernameError = (() => {
		if (!username) return '';
		const trimmed = username.trim();
		if (trimmed.length < 3) return 'Username must be at least 3 characters';
		if (trimmed.length > 50) return 'Username must be less than 50 characters';
		if (!/^[a-zA-Z0-9_-]+$/.test(trimmed))
			return 'Username can only contain letters, numbers, underscores, and dashes';
		return '';
	})();

	// Form validity with explicit reactive dependencies
	$: formValid = username.trim() && usernameValid && bioValid;

	// Debug validation state changes
	$: {
		logger.debug('Step 2 validation state:', {
			username: !!username,
			bio: !!bio,
			usernameValid,
			bioValid,
			usernameError,
			bioError,
			formValid
		});
	}

	function handleSubmit(e) {
		e.preventDefault();
		logger.debug('Step 2 form submitted');

		if (!username.trim()) {
			showError('Please enter a username.');
			return;
		}

		if (!formValid) {
			showError('Please fix validation errors before submitting.');
			return;
		}

		// Sanitize bio before submission
		const sanitizedBio = sanitizeBio(bio);

		createBackendUser(username.trim(), sanitizedBio, currency);
	}

	async function createBackendUser(username, bio, currency) {
		logger.debug('Creating backend user:', { username, currency, bioLength: bio.length });

		loading = true;
		hideMessages();

		try {
			// Get Firebase token from storage
			const { getFirebaseTokens } = await import('src/lib/auth/firebase-token-storage.ts');
			const tokens = getFirebaseTokens();

			if (!tokens || !tokens.idToken) {
				showError('Authentication token not found. Please start the sign-up process again.');
				loading = false;
				return;
			}

			logger.debug('Firebase token retrieved for backend user creation');

			// Create backend user
			const response = await fetch('https://devbackend.splitdo.app:8443/api/users', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${tokens.idToken}`,
					'Content-Type': 'application/json',
					'Origin': 'https://splitdo.app'
				},
				body: JSON.stringify({
					username: username,
					bio: bio,
					currency: currency,
					language: 'en'
				})
			});

			if (response.ok) {
				const userData = await response.json();
				logger.info('Backend user created successfully:', userData);

				showSuccess('Profile created successfully! Redirecting...');

				// Redirect to dashboard after success
				setTimeout(() => {
					logger.info('Redirecting to dashboard...');
					window.location.href = '/app/dashboard';
				}, 1000);

			} else {
				const errorData = await response.json().catch(() => ({}));
				logger.error('Backend user creation failed:', response.status, errorData);

				let errorMsg = 'Failed to create user profile. Please try again.';

				switch (response.status) {
					case 409:
						errorMsg = 'Username is already taken. Please choose a different one.';
						break;
					case 400:
						errorMsg = errorData?.error || 'Invalid user data. Please check your information.';
						break;
					case 401:
						errorMsg = 'Authentication failed. Please try signing up again.';
						break;
					case 500:
						errorMsg = 'Server error. Please try again later.';
						break;
					default:
						errorMsg = errorData?.error || errorMsg;
						break;
				}

				showError(errorMsg);
				loading = false;
			}

		} catch (error) {
			logger.error('Backend user creation error:', error);
			showError('Network error. Please check your connection and try again.');
			loading = false;
		}
	}

	async function loadFirebaseUserInfo() {
		try {
			// Get Firebase auth info from JWT payload
			const { getTokens } = await import('src/lib/auth/firebase-token-storage.ts');
			const tokens = getTokens();

			if (tokens && tokens.idToken) {
				// Decode JWT to get email (basic decode, not verified)
				const payload = JSON.parse(atob(tokens.idToken.split('.')[1]));
				firebaseEmail = payload.email || '';
				logger.debug('Firebase user email loaded:', firebaseEmail);
			}
		} catch (error) {
			logger.warn('Could not load Firebase user info:', error);
		}
	}

	onMount(() => {
		logger.debug('FirebaseSignUpForm_Step2 component mounted');
		loadFirebaseUserInfo();
	});
</script>

<div class="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
	<div class="max-w-md w-full space-y-8">
		<!-- Header -->
		<div class="text-center">
			<h2 class="text-3xl font-bold text-gray-900 dark:text-white">Complete Your Profile</h2>
			<p class="mt-4 text-gray-600 dark:text-gray-300">
				Just a few more details to get started
			</p>

			<!-- Progress Indicator -->
			<div class="mt-6">
				<div class="flex items-center justify-center">
					<div class="flex items-center space-x-4">
						<!-- Step 1 -->
						<div class="flex items-center">
							<div class="h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium bg-green-600 text-white">
								✓
							</div>
							<span class="ml-2 text-sm font-medium text-gray-600 dark:text-gray-300">Create Account</span>
						</div>

						<!-- Connector -->
						<div class="h-1 w-12 bg-green-600"></div>

						<!-- Step 2 -->
						<div class="flex items-center">
							<div class="h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium bg-[#00d9ff] text-white">
								2
							</div>
							<span class="ml-2 text-sm font-medium text-gray-600 dark:text-gray-300">Set Up Profile</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Firebase User Email Display -->
			{#if firebaseEmail}
				<div class="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
					<p class="text-sm text-gray-600 dark:text-gray-400">
						Creating profile for: <span class="font-medium text-gray-800 dark:text-gray-200">{firebaseEmail}</span>
					</p>
				</div>
			{/if}
		</div>

		<!-- Main Content Card -->
		<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
			<div class="p-8">
				<!-- Error/Success Messages -->
				{#if errorMessage}
					<div class="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
						<p class="text-red-800 dark:text-red-200 text-sm">{errorMessage}</p>
					</div>
				{/if}

				{#if successMessage}
					<div class="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
						<p class="text-green-800 dark:text-green-200 text-sm">{successMessage}</p>
					</div>
				{/if}

				<form on:submit={handleSubmit} class="space-y-6">
					<!-- Username Field -->
					<div>
						<label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Username *
						</label>
						<input
							id="username"
							name="username"
							type="text"
							required
							bind:value={username}
							disabled={loading}
							class="w-full px-4 py-3 border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00d9ff] focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							placeholder="Choose a unique username"
						/>
						{#if usernameError}
							<p class="mt-1 text-sm text-red-600 dark:text-red-400">{usernameError}</p>
						{/if}
					</div>

					<!-- Currency Field -->
					<div>
						<label for="currency" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Preferred Currency
						</label>
						<select
							id="currency"
							name="currency"
							bind:value={currency}
							disabled={loading}
							class="w-full px-4 py-3 border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#00d9ff] focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#each currencies as curr}
								<option value={curr.code}>{curr.symbol} {curr.name} ({curr.code})</option>
							{/each}
						</select>
					</div>

					<!-- Bio Field -->
					<div>
						<label for="bio" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Bio (Optional)
						</label>
						<textarea
							id="bio"
							name="bio"
							rows="3"
							bind:value={bio}
							on:input={(e) => { bio = sanitizeBio(e.target.value); }}
							disabled={loading}
							class="w-full px-4 py-3 border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00d9ff] focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed resize-none"
							placeholder="Tell us a bit about yourself (max 100 characters)"
						></textarea>
						<div class="mt-1 flex justify-between text-xs">
							<span class="text-gray-500 dark:text-gray-400">
								Only letters, numbers, and .,?!#@ symbols allowed
							</span>
							<span class="text-gray-500 dark:text-gray-400">
								{bio.length}/100
							</span>
						</div>
						{#if bioError}
							<p class="mt-1 text-sm text-red-600 dark:text-red-400">{bioError}</p>
						{/if}
					</div>

					<div>
						<button
							type="submit"
							disabled={loading || !formValid}
							class="w-full flex justify-center items-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium text-white bg-[#00d9ff] hover:bg-[#00b8d4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00d9ff] dark:focus:ring-offset-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if loading}
								<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Creating profile...
							{:else}
								Complete Sign Up
							{/if}
						</button>
					</div>
				</form>

			</div>

			<!-- Back to Sign In Link -->
			<div class="text-center pb-4">
				<p class="text-sm text-gray-600 dark:text-gray-400">
					Need to start over?
					<a href="/auth/sign-in" class="font-medium text-[#00d9ff] hover:text-[#00b8d4] transition-colors">
						Sign in instead
					</a>
				</p>
			</div>
		</div>
	</div>
</div>