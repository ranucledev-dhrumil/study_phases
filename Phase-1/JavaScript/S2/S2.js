// Function declaration — hoisted, can be called before it's defined
function greet(name) {
  return `Hello, ${name}`;
}

// Function expression — NOT hoisted the same way
const greet2 = function(name) {
  return `Hello, ${name}`;
};

// Arrow function — shorter syntax, different `this` behavior
const greet3 = (name) => {
  return `Hello, ${name}`;
};

// Implicit return (single expression, no braces)
const greet4 = name => `Hello, ${name}`;

function greet(name = "stranger") {
  return `Hello, ${name}`;
}

// Rest parameters (collect extra args into an array):
function sum(...nums) {
  return nums.reduce((acc, n) => acc + n, 0);
}
sum(1, 2, 3); // 6

// Closures: inner function has access to outer function's variables even after the outer function has returned
function outer() {
  let count = 0;
  function inner() {
    count++;
    return count;
  }
  return inner;
}

const counter = outer();
counter(); // 1
counter(); // 2


// Array methods:
const nums = [1, 2, 3, 4, 5];

// map, filter return new arrays (non-mutating)
nums.map(n => n * 2);            // [2, 4, 6, 8, 10] — new array, transformed
nums.filter(n => n % 2 === 0);   // [2, 4] — new array, filtered

// sort, push, pop, splice, reverse mutate the original array
nums.reduce((acc, n) => acc + n, 0); // 15 — single accumulated value
nums.find(n => n > 3);           // 4 — first match, or undefined
nums.some(n => n > 4);           // true — at least one matches
nums.every(n => n > 0);          // true — all match
nums.includes(3);                // true
nums.sort((a, b) => a - b);      // sorts in place! numeric sort needs a compare fn
nums.indexOf(3);                 // 2


const arr = [1, 2, 3];
const doubled = arr.map(n => n * 2); // arr is untouched, doubled is new
arr.sort(); // arr itself is now sorted

// Spread with arrays:
const a = [1, 2];
const b = [3, 4];
const combined = [...a, ...b]; // [1, 2, 3, 4]
const copy = [...a];           // shallow copy, doesn't mutate original

// Destructuring:
const [first, second, ...rest] = [1, 2, 3, 4];
// first = 1, second = 2, rest = [3, 4]