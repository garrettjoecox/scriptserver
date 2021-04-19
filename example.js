const { JavaServer, RconConnection } = require('./packages/core');

const server = new JavaServer();
const rconConnection = new RconConnection();

server.on('console', console.log);
server.on('started', () => rconConnection.connect());

server.start();

rconConnection.on('connected', async () => {
  console.log(await rconConnection.send('help'));
});
