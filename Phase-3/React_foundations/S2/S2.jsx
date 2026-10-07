// Part A: Class Components (the "why" behind hooks)
// Before hooks existed (pre-2019), class components were the only way to have state and lifecycle behavior in React.
class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
    this.handleClick = this.handleClick.bind(this); // manual binding
  }

  handleClick() {
    this.setState({ count: this.state.count + 1 });
  }

  componentDidMount() {
    console.log("Counter mounted");
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.count !== this.state.count) {
      console.log("count changed to", this.state.count);
    }
  }

  componentWillUnmount() {
    console.log("Counter about to unmount");
  }

  render() {
    return (
      <div>
        <p>{this.state.count}</p>
        <button onClick={this.handleClick}>Increment</button>
      </div>
    );
  }
}

// Key pain points this reveals (all of which hooks were built to solve):

// this binding hell. Since you know Java, this in Java always refers to the enclosing instance predictably. In JS, this depends on how a function is called, not where it's defined. When you pass this.handleClick as a callback (onClick={this.handleClick}), it loses its binding to the instance unless you explicitly .bind(this) in the constructor, or use an arrow function class field. This is a JS quirk, not a React quirk — but React class components force you to confront it constantly.
// Lifecycle methods scatter related logic. componentDidMount, componentDidUpdate, componentWillUnmount are separate methods. If you have one piece of logic (say, subscribing to a websocket) that needs setup on mount, update-handling, and teardown on unmount, that logic gets split across three methods instead of living together. This is called the "wrong lifecycle, right concern" problem.
// No easy way to share stateful logic between components. In Java/Spring you'd extract shared behavior into a service class or use composition via interfaces. Class components could only share logic via inheritance (fragile, discouraged) or patterns like "render props" / "higher-order components" (verbose, wrapper-hell). There was no lightweight way to say "extract this piece of stateful logic and reuse it elsewhere."
// setState is asynchronous and can be batched — calling this.setState({ count: this.state.count + 1 }) twice in a row doesn't guarantee two increments, because React may batch the updates and both reads see the same stale this.state.count. (This exists in hooks too, but it's less surprising once you understand functional updates — covered below.)

// Part B: Function Components + Hooks:
// Hooks (introduced React 16.8) let function components have state and lifecycle-like behavior without classes — solving all four pain points above: no this, related logic lives together in one useEffect, logic is trivially extracted into a custom hook (just a function), and updates are more predictable via functional form.

// useState:
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0); // [currentValue, setterFunction]

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

// useState(initialValue) returns a pair: the current value and a setter.
// Calling the setter triggers a re-render with the new value — this is the core mechanism that connects "data changes" to "UI updates."
// Functional updates: when the new state depends on the previous state, prefer the functional form to avoid stale-closure bugs:

setCount((prevCount) => prevCount + 1); // safe even with multiple rapid calls
// vs the unsafe version if called multiple times before a re-render:
setCount(count + 1); // may use a stale `count` if called again before re-render

// useEffect :Handles "side effects" — anything that reaches outside the component's pure render logic: API calls, subscriptions, timers, manually touching the DOM.

import { useState, useEffect } from "react";

function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval); // cleanup, runs before next effect or unmount
  }, []); // dependency array

  return <p>{seconds}s elapsed</p>;
}
// The dependency array is the trickiest part:
// useEffect(fn) — no array: runs after every render.
// useEffect(fn, []) — empty array: runs once, after the first render (roughly equivalent to componentDidMount)
// useEffect(fn, [dep1, dep2]) — runs after first render and whenever dep1 or dep2 changes.

// The cleanup function (the function you return from inside the effect) runs before the effect re-runs, and on unmount — replaces componentWillUnmount, but colocated with the setup logic instead of split into a separate method.

// Event handling
function Form() {
  const handleSubmit = (e) => {
    e.preventDefault(); // stop native browser form submission/page reload
    console.log("submitted");
  };

  return <form onSubmit={handleSubmit}><button type="submit">Go</button></form>;
}

// React wraps native DOM events in a SyntheticEvent (cross-browser consistent wrapper) — behaves like the native event (.preventDefault(), .target, etc.) but normalized.
// Event handlers are passed as function references, not called: onClick={handleClick}, not onClick={handleClick()} (the latter calls it immediately during render — a very common beginner bug).  
// Inline arrow functions (onClick={() => doSomething(id)}) are fine and common when you need to pass arguments.

// Custom hooks (brief intro)
// Any function starting with use that calls other hooks internally. This is the replacement for class-component logic sharing:
function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  const increment = () => setCount(c => c + 1);
  return { count, increment };
}

// usage in any component:
function MyComponent() {
  const { count, increment } = useCounter(10);
  return <button onClick={increment}>{count}</button>;
}

// Rules of Hooks:
// Only call hooks at the top level — never inside loops, conditions, or nested functions.
// Only call hooks from React function components or other custom hooks — never plain JS functions.

// These rules exist because React tracks hooks by call order between renders (internally, a linked list per component). Conditionally skipping a useState call would shift every subsequent hook's position and corrupt state tracking.

// React tracks hooks by call order between renders (internally like a linked list per component instance). If a hook call is conditionally skipped, every subsequent hook's position shifts, corrupting React's ability to match state slots to the right hook across renders — hence the rule that hooks must always be called unconditionally at the top level