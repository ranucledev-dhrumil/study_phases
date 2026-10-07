// 1. Object Literals
const person = {
  name: 'John Doe',
  age: 30,
  isStudent: false,
  greet: function() {
    console.log(`Hello user, ${this.name}`);
  },
};

person.name;        // "Alex" — dot notation
person["age"];       // 28 — bracket notation (needed for dynamic keys)

const key = "age";
person[key];         // 28 — dot notation can't do this

// Adding, Updating, Deleting
person.city = "NYC";      // add
 
person.age = 29;          // update

delete person.isStudent;  // remove

// Nested Objects
const user = {
  name: "Sam",
  address: {
    city: "Boston",
    zip: "02108"
  }
};
// console.log(user.address.city);"

// Object Destructuring: 
const { name, age } = person;
// console.log(name, age);

// renaming while destructuring
const { name: fullName } = person;
// console.log(fullName); 
// console.log(person); 

// default values
const { country = "USA" } = person;
// console.log(country);

// nested destructuring
const { address: { city } } = user;
// console.log(city);

// 5. Spread & Object.assign (copying/merging)
const updated = { ...person, age: 30 };   // copy + override
// console.log(updated);
const merged = { ...person, ...{ job: "Dev" } };
// console.log(merged);

// ⚠️ Spread is a shallow copy — nested objects are still shared by reference:
const copy = { ...user };
copy.address.city = "LA";
// console.log(user.address.city); 

// Useful Object Methods
// console.log(Object.keys(person));     // ["name", "age", ...]
// console.log(Object.values(person));   // ["Alex", 28, ...]
// console.log(Object.entries(person));  // [["name","Alex"], ["age",28], ...]

// Object.entries(person).forEach(([key, value]) => {
//   console.log(key, value);
// });

// Checking Properties
// console.log("name" in person);                  // true
// console.log(person.hasOwnProperty("name"));     // true
// console.log(person.age !== undefined);          // common existence check

// Object Equality (a common gotcha)
const a = { x: 1 };
const b = { x: 1 };
// console.log(a === b);   // false! different references in memory
// console.log(a === a);   // true — same reference
