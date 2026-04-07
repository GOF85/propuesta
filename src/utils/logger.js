const fs = require('fs');
const path = require('path');

const logFile = path.join(process.cwd(), 'debug.log');

exports.log = (msg) => {
    const timestamp = new Date().toISOString();
    try {
        fs.appendFileSync(logFile, `[${timestamp}] ${msg}\n`);
    } catch(e) {
        console.error('Logging failed', e);
    }
};
