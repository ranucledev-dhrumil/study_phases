const path = require('path')
const data = "Hello World 3"

path.join(__dirname, data, 'file.txt')

console.log(path.join(__dirname, 'data', 'file.txt'))