const { log } = require("console");
const createCounter = require("./counter");

const counter = createCounter(10);

console.log(counter.getValue());  // 10
console.log(counter.increment()); // 11
console.log(counter.increment()); // 12
console.log(counter.decrement()); // 11
console.log(counter.getValue());  // 11

// console.log('A');
// setTimeout(() => console.log('B'), 0);
// Promise.resolve().then(() => console.log('C')).then(() => console.log('D'));
// console.log('E');

// A E C D B


const user = {
    name: "Priya",
    age: 28,
    address: {
        city: "Ahmedabad",
        zip: "380001"
    }
};

let { name, address: { city } } = user

console.log(name)
console.log(city)

function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}


async function run(){
    await delay(1000)
    console.log("1 second passed")

    await delay(500)
    console.log("another 0.5s passed")
}

run()