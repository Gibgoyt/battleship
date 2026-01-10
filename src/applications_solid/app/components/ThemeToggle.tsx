import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: (isDark: boolean) => void;
}

const ThemeToggle: Component<ThemeToggleProps> = (props) => {
  const [isAnimating, setIsAnimating] = createSignal(false);

  const handleToggle = () => {
    setIsAnimating(true);
    props.onToggle(!props.isDark);

    // Reset animation after it completes
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleToggle}
      class="relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 group"
      style={`
        background: ${props.isDark ? 'var(--crypto-bg-tertiary)' : 'var(--crypto-bg-secondary)'};
        border: 2px solid var(--crypto-border);
        color: var(--crypto-text-secondary);
      `}
      onMouseEnter={(e) => {
        e.target.style.borderColor = 'var(--crypto-border-accent)';
        e.target.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.target.style.borderColor = 'var(--crypto-border)';
        e.target.style.transform = 'scale(1)';
      }}
      title={props.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {/* Sun Icon (Light Mode) */}
      <svg
        class={`absolute w-6 h-6 transition-all duration-300 ${
          props.isDark
            ? 'opacity-0 rotate-90 scale-50'
            : 'opacity-100 rotate-0 scale-100'
        } ${isAnimating() ? 'animate-pulse' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>

      {/* Moon Icon (Dark Mode) */}
      <svg
        class={`absolute w-6 h-6 transition-all duration-300 ${
          props.isDark
            ? 'opacity-100 rotate-0 scale-100'
            : 'opacity-0 -rotate-90 scale-50'
        } ${isAnimating() ? 'animate-pulse' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>

      {/* Ripple Effect */}
      <div
        class={`absolute inset-0 rounded-full transition-all duration-300 ${
          isAnimating() ? 'animate-ping' : ''
        }`}
        style="background: radial-gradient(circle, var(--crypto-primary-cyan) 0%, transparent 70%); opacity: 0.1;"
      />
    </button>
  );
};

export default ThemeToggle;