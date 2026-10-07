import { useState } from "react";

function CounterComponent() {
  const [count, setCount] = useState(0);
  return (
    <>
      <p> Count is {count}</p>
      <button onClick={() => setCount((count) => count + 1)}>Increment</button>
      <button
        onClick={() =>
          count > 0 ? setCount((count) => count - 1) : setCount(0)
        }
      >
        Decrement
      </button>
    </>
  );
}

export default CounterComponent;
