import { useEffect, useState } from "react";

function HookTimer() {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((elapsedTime) => elapsedTime + 1);
    }, 1000);

    return () => {
      console.log(timer + " has been removed");
      clearInterval(timer);
    };
  });

  const resetTimer = () => {
    setElapsedTime(0);
  };

  return (
    <div>
      <p>hookTimer - Elapsed: {elapsedTime} seconds</p>

      <button onClick={resetTimer}>Reset</button>
    </div>
  );
}

export default HookTimer;
