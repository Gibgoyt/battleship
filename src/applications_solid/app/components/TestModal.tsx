import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';

const TestModal: Component<{ isDark: boolean }> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);

  console.log('[TestModal] Rendering with isOpen:', isOpen());

  return (
    <div>
      {/* Test Button */}
      <button
        onClick={() => {
          console.log('[TestModal] Button clicked, current state:', isOpen());
          setIsOpen(!isOpen());
          console.log('[TestModal] New state:', isOpen());
        }}
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        Test Modal (State: {isOpen() ? 'Open' : 'Closed'})
      </button>

      {/* Modal */}
      {isOpen() && (
        <div class="fixed inset-0 z-50 flex items-center justify-center">
          <div
            class="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />
          <div class={`relative w-full max-w-md mx-4 p-6 rounded-lg shadow-xl z-10 ${
            props.isDark ? 'bg-zinc-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <h2 class="text-xl font-bold mb-4">Test Modal</h2>
            <p class="mb-4">This is a test modal to verify modal rendering works.</p>
            <button
              onClick={() => setIsOpen(false)}
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close Modal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestModal;