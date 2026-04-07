const http = require('http');

const data = JSON.stringify({
  message_body: 'Debug Message ' + new Date().toISOString()
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/p/c8322eb4e84642ceb797eb8708ce62c1/messages',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log('STATUS: ' + res.statusCode);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log('BODY: ' + chunk);
  });
});

req.on('error', (e) => {
  console.error('problem with request: ' + e.message);
});

req.write(data);
req.end();
