const EventEmitter = require('events');
const logMessage = require('./logger.js');

logMessage("Server started1")
logMessage("Server started2")
logMessage("Server started3")
logMessage("Server started4")
logMessage("Server started5")


const orderEvents = new EventEmitter();

orderEvents.on('orderPlaced', (id) => console.log(`Order received: ${id}`));
orderEvents.on('orderPlaced', (id) => logMessage(`Order ${id} placed!`));

orderEvents.emit('orderPlaced', 1)
orderEvents.emit('orderPlaced', 2)
orderEvents.emit('orderPlaced', 3)
orderEvents.emit('orderPlaced', 4)
orderEvents.emit('orderPlaced', 5)

function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

async function runSequential(){
    const start = Date.now();
    await delay(500)
    await delay(500)
    await delay(500)
    const end = Date.now();
    logMessage("Total Time runSequential: "+(end - start));
}

async function runParallel(){
    const start = Date.now();
    await Promise.all([delay(500), Promise.reject("boom"), delay(500)]);
    const end = Date.now();
    logMessage("Total Time runParallel: "+(end - start));
}

runSequential()
runParallel()

// [delay(500), Promise.reject("boom"), delay(1000)]
// it rejects immediately as all 3 promises are executed in parallel and not seperately