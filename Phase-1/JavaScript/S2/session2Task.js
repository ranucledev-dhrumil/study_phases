// QUIZ:
// function outer() {
//   let x = 10;
//   return function() {
//     x++;
//     return x;
//   };
// }
// const fn = outer();
// console.log(fn());
// console.log(fn());
// console.log(outer()());


// const obj = {
//   name: "Alex",
//   greet: function() {
//     console.log(this.name);
//   },
//   greetArrow: () => {
//     console.log(this.name);
//   }
// };
// obj.greet();
// obj.greetArrow();


// function makeMultiplier(factor) {
//   return function(n) {
//     return n * factor;
//   };
// }
// const double = makeMultiplier(2);
// const triple = makeMultiplier(3);
// console.log(double(5));
// console.log(triple(5));
// console.log(double(10));

function makeBankAccount(startingBalance){
  let balance = startingBalance;
  return {
    deposit(amount){
      return balance += amount;
    },
     getBalance(){
      return balance;
    }
  }
}

const account = makeBankAccount(100);
account.deposit(50);
// console.log(account.getBalance()); // 150


const products = [
  { name: "Laptop", price: 1000, inStock: true },
  { name: "Phone", price: 500, inStock: false },
  { name: "Tablet", price: 300, inStock: true },
  { name: "Watch", price: 200, inStock: true },
];

let answer = (products.filter(newProds => newProds.inStock == true).map(newProds => newProds.price)).reduce((accu, price) => accu + price, 0);
// console.log(answer); 

// const timer = {
//   seconds: 0,
//   start: function() {
//     setInterval(() => {
//       this.seconds++;
//       console.log(this.seconds);
//     }, 1000);
//   }
// };
// timer.start();

function average(...nums) {
  let sum = nums.reduce((acc, num) => acc+num, 0);
  let avg = sum/nums.length;
  return avg;
}
console.log(average(18, 21, 31, 43, 52));
