const http = require('http'); // module http from node.JS
const app = require('./app');
require('dotenv').config(); // import des variables d'environnement

// define port du port from env or 4000
const port = process.env.PORT || 4000;
app.set('port', port);

// define URL
const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

// function to define the port to use
// const normalizePort = val => {
//   const port = parseInt(val, 10);
//   if (isNaN(port)) {
//     return val;
//   }
//   if (port >= 0) {
//     return port;
//   }
//   return false;
// };

// const port = normalizePort(process.env.PORT || '4000');
// app.set('port', port);

// function to handle errors 
const errorHandler = error => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges.');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use.');
      process.exit(1);
      break;
    default:
      throw error;
  }
};

// create a server instance with the app application 
const server = http.createServer(app);

// errors handling
server.on('error', errorHandler);

// listening event handling
server.on('listening', () => {
  console.log(`Listening on ${baseUrl}`);
});

// start the server, listened from the defined port
server.listen(port);