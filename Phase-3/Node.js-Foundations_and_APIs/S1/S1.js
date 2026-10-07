var a = 1;    // function-scoped, hoisted, avoid using this
let b = 2;    // block-scoped, reassignable — like a local Java variable
const c = 3;  // block-scoped, NOT reassignable — like `final`

// const doesn't mean immutable — it means the binding can't be reassigned. const obj = {}; obj.x = 1; is legal.

// Block scope means { let x = 1; } — x doesn't exist outside those braces. var ignores this and leaks to the function scope, which causes bugs — this is why var is considered legacy.

function add(x, y) { return x + y; }        // function declaration
const add2 = (x, y) => x + y;                // arrow function
const add3 = function(x, y) { return x + y; }; // function expression

// Closures — a function "remembers" the variables from where it was defined, even after that outer function has returned:
function makeCounter() {
  let count = 0;
  return function () {
    count++;
    return count;
  };
}
const counter = makeCounter();
counter(); // 1
counter(); // 2

// Closures are how Node middleware, event handlers, and callbacks capture context — this comes up constantly in Express later.

// In JS, this depends on how a function is called, not where it's defined — except for arrow functions, which inherit this from their surrounding scope (lexical this). This is why arrow functions are usually preferred for callbacks.

const user = { name: "Alex", age: 25 };
const { name, age } = user;           // destructuring — like pulling fields out at once
const user2 = { ...user, age: 26 };   // spread — shallow copy + override, like a builder pattern

const nums = [1, 2, 3];
const [first, ...rest] = nums;        // first = 1, rest = [2, 3]

// You'll see destructuring everywhere in Node/Express — e.g. const { id } = req.params;

// CommonJS (Node's original system)
const fs = require('fs');
module.exports = myFunction;

// ES Modules (modern standard, needs "type": "module" in package.json)
import fs from 'fs';
export default myFunction;


// The Event Loop, Callbacks, Promises, async/await
// This is the core Node concept. No thread pool per request — one thread, an event loop, and a queue.

// Callback style (old, leads to "callback hell"):
fs.readFile('file.txt', (err, data) => {
  if (err) return console.error(err);
  console.log(data);
});

// Promises (a value that resolves later):
fetch(url)
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));

// async/await (syntactic sugar over promises — closest to how you already think in Java with blocking calls):
async function getData() {
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}

// Execution order quirk that trips everyone up:
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
// Output: 1, 4, 3, 2
// Synchronous code runs first, then the microtask queue (promises), then the macrotask queue (timers, I/O).