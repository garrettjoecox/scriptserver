// const event = require('./packages/event').default;
// const command = require('./packages/command').default;
// import { ScriptServer } from '@scriptserver/core';
// import event from '@scriptserver/event';
// import command from '@scriptserver/command';

// const server = new JavaServer();
// const rconConnection = new RconConnection();

// server.on('console', console.log);
// server.on('started', () => rconConnection.connect());

// server.start();

// rconConnection.on('connected', async () => {
//   console.log(await rconConnection.send('help'));
// });

// const scriptServer = new ScriptServer();

// event(scriptServer);
// command(scriptServer);
// util(scriptServer);

// scriptServer.start();

// scriptServer.on('console', console.log);
// scriptServer.on('started', () => {
//   console.log('Started!');
// });
// scriptServer.on('login', event => console.log('login', event));
// scriptServer.on('logout', event => console.log('logout', event));
// scriptServer.on('chat', event => console.log('chat', event));
// scriptServer.on('command', event => console.log('command', event));
// scriptServer.command('test', async event => {
//   await scriptServer.util.tellRaw('Hello', event.player, { color: 'red' });
//   console.log('test', event);
// });
/