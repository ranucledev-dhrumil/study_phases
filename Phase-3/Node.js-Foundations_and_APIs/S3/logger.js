const path = require('path');
const fs = require('fs');

async function logMessage(message) {

    const filepath = path.join(__dirname, 'app.log')

    try {
        await fs.promises.appendFile(filepath, "[" + new Date().toISOString() + "]: " + message + "\n")
    } catch (error) {
        console.error('Cannot write to app.log:', error);
    }

};

module.exports = logMessage;