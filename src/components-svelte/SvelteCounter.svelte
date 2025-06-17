<script>
  let count = 0;

  function increment() {
    count += 1;
  }

  function decrement() {
    count -= 1;
  }
</script>

<div class="counter-container">
  <h3>Svelte Counter</h3>
  <div class="counter-display">
    <button on:click={decrement} class="btn">-</button>
    <span class="count">{count}</span>
    <button on:click={increment} class="btn">+</button>
  </div>
</div>

<style>
  .counter-container {
    padding: 1rem;
    border: 2px solid #ff3e00;
    border-radius: 8px;
    margin: 1rem 0;
    text-align: center;
  }

  .counter-display {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 0.5rem;
  }

  .btn {
    background-color: #ff3e00;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.2rem;
  }

  .btn:hover {
    background-color: #e93100;
  }

  .count {
    font-size: 1.5rem;
    min-width: 2rem;
  }
</style>