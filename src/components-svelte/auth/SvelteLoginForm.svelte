<script>
	import { onMount } from 'svelte';
	import { cognitoConfig } from '../../lib/cognito-config.ts';
	import { createLogger } from '../../lib/logger';

	const logger = createLogger('SvelteLoginForm');

	let email = '';
	let password = '';
	let rememberMe = false;
	let loading = false;
	let errorMessage = '';
	let successMessage = '';

	let userPool;
	let CognitoUserPool, CognitoUser, AuthenticationDetails;

	onMount(async () => {
		logger.info('Component mounted, initializing');
		
		// Dynamic import to prevent SSR issues
		const cognitoModule = await import('amazon-cognito-identity-js');
		CognitoUserPool = cognitoModule.CognitoUserPool;
		CognitoUser = cognitoModule.CognitoUser;
		AuthenticationDetails = cognitoModule.AuthenticationDetails;
		
		const poolData = {
			UserPoolId: cognitoConfig.userPoolId,
			ClientId: cognitoConfig.userPoolWebClientId
		};
		
		userPool = new CognitoUserPool(poolData);
		logger.info('User pool created successfully');
	});

	function showError(message) {
		logger.error(`Authentication error: ${message}`);
		errorMessage = message;
		successMessage = '';
	}

	function showSuccess(message) {
		logger.info(`Authentication success: ${message}`);
		successMessage = message;
		errorMessage = '';
	}

	function hideMessages() {
		errorMessage = '';
		successMessage = '';
	}

	function handleSubmit(e) {
		e.preventDefault();
		logger.debug('Form submitted');

		if (!email || !password) {
			showError('Please enter both email and password.');
			return;
		}

		signIn(email, password, rememberMe);
	}

	function signIn(email, password, rememberMe) {
		logger.info(`Starting sign in for: ${email}`);
		
		if (!userPool || !CognitoUserPool || !CognitoUser || !AuthenticationDetails) {
			showError('Authentication system not ready. Please wait and try again.');
			return;
		}
		
		hideMessages();
		loading = true;

		const authenticationDetails = new AuthenticationDetails({
			Username: email,
			Password: password,
		});

		const cognitoUser = new CognitoUser({
			Username: email,
			Pool: userPool,
		});

		logger.debug('Calling authenticateUser');

		cognitoUser.authenticateUser(authenticationDetails, {
			onSuccess: function (result) {
				logger.info('Authentication SUCCESS');

				const accessToken = result.getAccessToken().getJwtToken();
				const idToken = result.getIdToken().getJwtToken();
				const refreshToken = result.getRefreshToken().getToken();

				logger.debug('Tokens received', {
					accessToken: accessToken ? 'PRESENT' : 'MISSING',
					idToken: idToken ? 'PRESENT' : 'MISSING',
					refreshToken: refreshToken ? 'PRESENT' : 'MISSING'
				});

				// Store tokens using the new token storage bridge
				const storeTokensAsync = async () => {
					try {
						logger.debug('Storing tokens with token storage bridge');
						
						// Import token storage dynamically
						const { storeTokens, debugStorage } = await import('../../lib/auth/token-storage');
						
						// Store tokens in both localStorage/sessionStorage AND cookies
						storeTokens({
							accessToken,
							idToken,
							refreshToken,
							rememberMe
						});
						
						// Debug storage contents after storing
						debugStorage();
						
						logger.info('Tokens stored successfully');
						
						showSuccess('Login successful! Redirecting...');
						
						// Redirect after short delay
						setTimeout(() => {
							logger.info('Redirecting to dashboard');
							window.location.href = '/app/dashboard';
						}, 1000);
						
					} catch (storageError) {
						logger.error('Failed to store tokens', storageError);
						showError('Login successful but failed to store session. Please try again.');
					}
				};
				
				// Execute the async function
				storeTokensAsync();
			},

			onFailure: function (err) {
				logger.error('Authentication FAILED', err);
				loading = false;

				let errorMsg = 'Login failed. Please try again.';
				
				switch (err.code) {
					case 'UserNotFoundException':
						errorMsg = 'No account found with this email address.';
						break;
					case 'NotAuthorizedException':
						errorMsg = 'Incorrect email or password.';
						break;
					case 'UserNotConfirmedException':
						errorMsg = 'Please verify your email address before signing in.';
						break;
					case 'TooManyRequestsException':
						errorMsg = 'Too many failed attempts. Please try again later.';
						break;
					case 'TooManyFailedAttemptsException':
						errorMsg = 'Account temporarily locked due to too many failed attempts.';
						break;
					default:
						errorMsg = err.message || errorMsg;
				}

				showError(errorMsg);
			},

			newPasswordRequired: function (userAttributes, requiredAttributes) {
				logger.warn('New password required');
				loading = false;
				showError('New password required. Please contact support.');
			}
		});
	}

</script>

<main>
	<!-- Background -->
	<div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
		<div class="mb-8">
			<div class="max-w-md w-full space-y-8">
				<!-- Header -->
				<div class="text-center">
					<div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-600">
						<svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					</div>
					<h2 class="mt-6 text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
						Sign in to your account
					</h2>
					<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
						Welcome back to DocForge AI
					</p>
				</div>

				<!-- Form -->
				<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
					<!-- Error Message -->
					{#if errorMessage}
						<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
							{errorMessage}
						</div>
					{/if}

					<!-- Success Message -->
					{#if successMessage}
						<div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
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
								class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
								class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
									class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700"
								/>
								<label for="remember-me" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
									Remember me
								</label>
							</div>

							<div class="text-sm">
								<a href="/auth/forgot-password" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
									Forgot your password?
								</a>
							</div>
						</div>

						<div>
							<button
								type="submit"
								disabled={loading}
								class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{#if loading}
									<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Signing in...
								{:else}
									Sign in
								{/if}
							</button>
						</div>
					</form>

				</div>

				<!-- Sign Up Link -->
				<div class="text-center">
					<p class="text-sm text-gray-600 dark:text-gray-400">
						Don't have an account?
						<a href="/auth/sign-up" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
							Sign up here
						</a>
					</p>
				</div>
			</div>
		</div>
	</div>
</main>