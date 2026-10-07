var x = 10;    // function-scoped, hoisted, can be redeclared — avoid using this
let y = 20;    // block-scoped, can be reassigned
const z = 30;  // block-scoped, cannot be reassigned


const arr = [1, 2, 3];
arr.push(4);      // fine
// arr = [5, 6];  // Error

// Primitives
typeof "hello"      // "string"
typeof 42           // "number"
typeof true         // "boolean"
typeof undefined    // "undefined"

typeof null         // "object" (famous JS bug, but intentional/kept)

// Reference types
typeof {}           // "object"
typeof []           // "object"
typeof function(){} // "function"

// Type coercion
"5" + 3     // "53" (string concatenation)
"5" - 3     // 2   (numeric coercion)
5 == "5"    // true  (loose equality — coerces types) - does'nt check type
5 === "5"   // false (strict equality — no coercion)  - checks type

// Control flow
if (age >= 18) {
  console.log("adult");
} else if (age >= 13) {
  console.log("teen");
} else {
  console.log("child");
}

// ternary
const status = age >= 18 ? "adult" : "minor";

// switch
switch (day) {
  case "Mon":
    console.log("Start of week");
    break;
  default:
    console.log("Some other day");
}

// Truthy/falsy: 0, "", null, undefined, NaN, false are falsy — everything else (including "0" and []) is truthy.
// Short-circuiting: a && b, a || b, and nullish coalescing a ?? b (only falls back if a is null/undefined, not other falsy values).

// classic for
for (let i = 0; i < 5; i++) {
  console.log(i);
}

// for...of — iterate values (arrays, strings)
for (const val of [10, 20, 30]) {
  console.log(val);
}

// for...in — iterate keys (objects, avoid on arrays)
for (const key in { a: 1, b: 2 }) {
  console.log(key);
}

// forEach — array method, not a real "loop" keyword
[10, 20, 30].forEach((val, index) => {
  console.log(index, val);
});
// forEach can't be stopped with break/continue, and it always returns undefined