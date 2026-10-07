import { useState } from "react"
import ClassTimer from "./components/ClassTimer"
import HookTimer from "./components/HookTimer"
import ControlledForm from "./components/controlledForm";
import CounterDemo from "./components/CounterDemo";

function App() {
  const [showTimer, setShowTimer] =  useState(true);

  return (
    <div>
      <button onClick={() => {setShowTimer(prev => !prev)}}>
        {showTimer ? "Unmount Timers" : "Mount Timers"}
      </button>

      {showTimer && (
        <>
          <HookTimer />
          <ClassTimer />
        </>
      )}

      <ControlledForm/>

      <CounterDemo initial={10} />
    </div>  
  );
}

export default App
