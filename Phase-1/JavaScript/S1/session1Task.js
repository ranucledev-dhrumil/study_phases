// QUIZ:
console.log("5" - 3);

// console.log("var behaviour: ");
// for (var i = 0; i < 3; i++) {
//   setTimeout(() => console.log(i), 0);
// }

// console.log("let behaviour: ");
// for (let i = 0; i < 3; i++) {
//   setTimeout(() => console.log(i), 0);
// }

console.log("nullish coalescing ?? demonstration: ");
let x;
console.log(x ?? "default");
console.log(0 ?? "default");

//Tasks:

// for(let i = 1; i <= 30; i++) {
//     if(i%3 == 0 && i%5 == 0) {
//         console.log("FizzBuzz");
//     }
//     else if(i%3 == 0) {
//         console.log("Fizz");
//     }   
//     else if(i%5 == 0) {
//         console.log("Buzz");
//     }
//     else {
//         console.log(i);
//     }
// }

// let score = 79;

// if(score >= 90) {
//     console.log("A");
// }
// else if(score< 90 && score >=80){
//     console.log("B");
// }
// else if(score< 80 && score >=70){
//     console.log("C");
// }
// else if(score< 70 && score >=60){
//     console.log("D");
// }   
// else {
//     console.log("F");
// }   

const nums = [4, 8, 15, 16, 23, 42];

// nums.forEach((num) => {
//     console.log(num*2);
// });

// for(const num of nums) {
//     if(num > 20) {
//         break;
//     }
//     if(num > 10) {
//         console.log(num);
//     }
// }

console.log(1 + "1");
console.log("10" - "4");
console.log(true + 1);
console.log([] + []);
console.log([] + {});   