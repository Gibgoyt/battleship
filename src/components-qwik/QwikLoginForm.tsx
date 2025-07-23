/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal, useStore, $ } from '@builder.io/qwik';
import { CognitoSignInService, type SignInCredentials } from '../lib/auth/sign-in';
import { createLogger } from '../lib/logger';

const logger = createLogger('QwikLoginForm');

interface FormState {
  email: string;
  password: string;
  rememberMe: boolean;
  isLoading: boolean;
  error: string;
  success: string;
}

export default component$(() => {
  const formState = useStore<FormState>({
    email: '',
    password: '',
    rememberMe: false,
    isLoading: false,
    error: '',
    success: '',
  });

  // Initialize auth service on demand (not in useVisibleTask$ to avoid chunking issues)
  const getAuthService = $(() => {
    logger.debug('Creating auth service');
    return new CognitoSignInService();
  });

  const showError = $((message: string) => {
    logger.error(`Form error: ${message}`);
    formState.error = message;
    formState.success = '';
  });

  const showSuccess = $((message: string) => {
    logger.info(`Form success: ${message}`);
    formState.success = message;
    formState.error = '';
  });

  const hideMessages = $(() => {
    formState.error = '';
    formState.success = '';
  });

  const setLoading = $((loading: boolean) => {
    formState.isLoading = loading;
  });

  const handleSubmit = $(async (event: SubmitEvent) => {
    event.preventDefault();
    logger.debug('Form submitted');

    if (!formState.email || !formState.password) {
      await showError('Please enter both email and password.');
      return;
    }

    await hideMessages();
    await setLoading(true);

    try {
      const authService = await getAuthService();
      
      const credentials: SignInCredentials = {
        email: formState.email.trim(),
        password: formState.password,
        rememberMe: formState.rememberMe,
      };

      logger.debug('Calling sign in');
      const result = await authService.signIn(credentials);

      if (result.success) {
        logger.info('Sign in successful');
        await showSuccess('Login successful! Redirecting...');
        
        // Redirect after short delay
        setTimeout(() => {
          logger.info('Redirecting to dashboard');
          window.location.href = '/app/dashboard';
        }, 1000);
      } else {
        logger.error('Sign in failed', result.error);
        await showError(result.error || 'Login failed. Please try again.');
        await setLoading(false);
      }
    } catch (error) {
      logger.error('Unexpected error', error);
      await showError('An unexpected error occurred. Please try again.');
      await setLoading(false);
    }
  });

  const handleGoogleLogin = $(async () => {
    logger.debug('Google login clicked');
    await showError('Google login not yet implemented.');
  });

  const handleGitHubLogin = $(async () => {
    logger.debug('GitHub login clicked');
    await showError('GitHub login not yet implemented.');
  });

  return (
    <div class="max-w-md w-full space-y-8">
      {/* Header */}
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
          Welcome back to DocForge AI (Qwik Version)
        </p>
      </div>

      {/* Form */}
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-6">
        {/* Messages */}
        {formState.error && (
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {formState.error}
          </div>
        )}

        {formState.success && (
          <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
            {formState.success}
          </div>
        )}

        <form onSubmit$={handleSubmit} class="space-y-6" preventdefault:submit>
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={formState.isLoading}
              value={formState.email}
              onInput$={(e) => formState.email = (e.target as HTMLInputElement).value}
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
              autoComplete="current-password"
              required
              disabled={formState.isLoading}
              value={formState.password}
              onInput$={(e) => formState.password = (e.target as HTMLInputElement).value}
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
                disabled={formState.isLoading}
                checked={formState.rememberMe}
                onChange$={(e) => formState.rememberMe = (e.target as HTMLInputElement).checked}
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 disabled:opacity-50"
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
              disabled={formState.isLoading}
              class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formState.isLoading ? (
                <>
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
          </div>
        </div>

        {/* Social Login */}
        <div class="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick$={handleGoogleLogin}
            disabled={formState.isLoading}
            class="w-full inline-flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="#4285F4"/>
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick$={handleGitHubLogin}
            disabled={formState.isLoading}
            class="w-full inline-flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Continue with GitHub
          </button>
        </div>
      </div>

      {/* Sign Up Link */}
      <div class="text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <a href="/auth/sign-up" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
            Sign up here
          </a>
        </p>
      </div>
    </div>
  );
});