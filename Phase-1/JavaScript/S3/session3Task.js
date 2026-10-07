// QUIZ
const car = { make: "Toyota", model: "Corolla", year: 2022 };

// Object.entries(car).forEach(([key, value]) => {
//   console.log(`${key}: ${value}`);
// });


const book = { title: "1984", author: "Orwell" };
const { title, author, year = 2000 } = book;


//Tasks:

const employee = {
  name: "Jordan",
  department: "Engineering",
  salary: 70000
};

employee.startYear = 2020;
employee.salary = 75000;
delete employee.department;
// console.log(employee);

const settings = {
  theme: "dark",
  preferences: { notifications: true, sound: false }
};

// const copySettings = { ...settings};
// copySettings.preferences.sound = true;
// console.log(settings.preferences.sound); // true, because nested object is shared by reference

// const copySettings = { ...settings, preferences: {...settings.preferences } };
// copySettings.preferences.sound = true;
// console.log(settings .preferences.sound); // false, because nested object is copied

const inventory = {
  apples: 50,
  bananas: 30,
  oranges: 20
};

let max = 0;
let maxItem = null
Object.entries(inventory).forEach(([key, value]) => {
  if (max<value) {
    max = value;
    maxItem = key
  }
});
// console.log(max,maxItem)

function createProfile({ username, email, age = 18 }) {
  // use destructured params directly
  return `${username} (${age}) - ${email}`;
}

console.log(createProfile({username: "alice", email: "alice@example.com", age: 21}))
console.log(createProfile({username: "alice", email: "alice@example.com"}))