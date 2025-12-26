/** @jsxImportSource @builder.io/qwik */
import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';

export default component$(() => {
  const isDark = useSignal(false);

  const updateDarkMode = $((dark: boolean) => {
    console.log('🎯 Qwik updateDarkMode called with:', dark);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    console.log('🎯 After update - dark class exists:', document.documentElement.classList.contains('dark'));
  });

  useVisibleTask$(() => {
    const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
      (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    isDark.value = isDarkMode;
    updateDarkMode(isDarkMode);
  });

  const toggleDarkMode = $(() => {
    console.log('🚀 Qwik toggleDarkMode clicked!');
    console.log('🚀 Current isDark value:', isDark.value);
    const newDarkMode = !isDark.value;
    console.log('🚀 New darkMode will be:', newDarkMode);
    isDark.value = newDarkMode;
    localStorage.setItem('darkMode', newDarkMode.toString());
    updateDarkMode(newDarkMode);

    // Check phone images
    const lightImg = document.querySelector('img[src="/phone_screens/WalletScreen_LIGHT.png"]');
    const darkImg = document.querySelector('img[src="/phone_screens/WalletScreen_DARK.png"]');
    console.log('🚀 Light image element:', lightImg);
    console.log('🚀 Dark image element:', darkImg);
  });

  return (
    <button
      onClick$={toggleDarkMode}
      class="fixed bottom-6 right-6 p-3 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-200 shadow-lg z-50"
      aria-label="Toggle dark mode"
    >
      {isDark.value ? (
        <svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
        </svg>
      ) : (
        <svg class="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
});