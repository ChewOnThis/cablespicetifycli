const net = require('net');

const port = 3000; // Change to your port
const server = net.createServer();

server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is already in use`);
    } else {
        console.error('Error occurred:', err);
    }
});

server.once('listening', () => {
    console.log(`Port ${port} is available`);
    server.close();
});

server.listen(port);
