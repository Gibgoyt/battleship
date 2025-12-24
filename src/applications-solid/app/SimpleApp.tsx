import { createSignal } from 'solid-js'
import type { Component } from 'solid-js'

const SimpleApp: Component<{ firebaseToken?: string }> = (props) => {
  const [count, setCount] = createSignal(0);

  return (
    <div class="p-8 bg-zinc-900 text-white min-h-screen">
      <h1 class="text-3xl font-bold mb-4">Simple SolidJS Test App</h1>
      <p class="mb-4">Firebase Token: {props.firebaseToken ? 'Present' : 'Not provided'}</p>
      <p class="mb-4">Count: {count()}</p>
      <button
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => setCount(count() + 1)}
      >
        Increment
      </button>
      <p class="mt-4">If you can see this and the button works, SolidJS is functioning correctly.</p>
    </div>
  )
}

export default SimpleApp