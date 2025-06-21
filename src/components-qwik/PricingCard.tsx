/** @jsxImportSource @builder.io/qwik */
import {component$, useSignal, $, useStylesScoped$} from '@builder.io/qwik';

interface PricingCardProps {
  name?: string;
  price?: string;
  period?: string;
  features?: string[];
  highlighted?: boolean;
  buttonText?: string;
  buttonLink?: string;
}

export default component$<PricingCardProps>(({
  name = "",
  price = "",
  period = "month",
  features = [],
  highlighted = false,
  buttonText = "Get Started",
  buttonLink = "/auth/sign-up"
}) => {
  useStylesScoped$(`
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    
    .animate-float {
      animation: float 3s ease-in-out infinite;
    }
  `);

  const hovered = useSignal(false);

  const handleMouseEnter = $(() => {
    hovered.value = true;
  });

  const handleMouseLeave = $(() => {
    hovered.value = false;
  });

  return (
    <div
      class={`relative transition-all duration-300 transform ${hovered.value ? 'scale-105' : 'scale-100'} ${hovered.value ? 'animate-float' : ''}`}
      onMouseEnter$={handleMouseEnter}
      onMouseLeave$={handleMouseLeave}
    >
      {highlighted && (
        <div
          class="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
          Most Popular
        </div>
      )}

      <div
        class={`bg-white dark:bg-gray-800 rounded-2xl ${highlighted ? 'ring-2 ring-blue-500' : ''} ${hovered.value ? 'shadow-2xl' : 'shadow-lg'} p-8 h-full flex flex-col transition-all duration-300`}>
        <div class="text-center mb-8">
          <h3 class="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">{name}</h3>
          <div class="flex items-baseline justify-center">
            <span
              class="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{price}</span>
            <span class="text-gray-600 dark:text-gray-400 ml-2">/{period}</span>
          </div>
        </div>

        <ul class="space-y-4 mb-8 flex-grow">
          {features.map((feature, index) => (
            <li key={index} class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clip-rule="evenodd"></path>
              </svg>
              <span class="text-gray-700 dark:text-gray-300">{feature}</span>
            </li>
          ))}
        </ul>

        <a
          href={buttonLink}
          class={`w-full py-3 px-6 text-center font-semibold rounded-lg transition-all duration-300 ${
            highlighted
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {buttonText}
        </a>
      </div>
    </div>
  );
});