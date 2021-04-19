const { JavaServer, RconConnection } = require('./packages/core');

const server = new JavaServer();

server.on('console', console.log);

server.start();

// const rconConnection = new RconConnection();

// rconConnection.connect();

// rconConnection.on('connected', async () => {
//   console.log('test');
//   console.log(await rconConnection.send('help'));

//   rconConnection.disconnect();
// });
