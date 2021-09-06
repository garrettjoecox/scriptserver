import { ScriptServer, JavaServer, RconConnection } from '@scriptserver/core';
import { useEvent } from '@scriptserver/event';
import { useUtil } from '@scriptserver/util';
import { useCommand } from '@scriptserver/command';

// Example of only using the JavaServer & Plugins
// () => {
//   try {
//     const javaServer = new JavaServer();

//     useEvents(javaServer);
//     useCommand(javaServer);

//     javaServer.command('head', event => {
//       javaServer.send(`say ${event.player} issued "head" command`);
//     });

//     javaServer.start();
//   } catch (error) {
//     console.error(error);
//   }
// };

// Example of only using the RconConnection & Plugins
// () => {
//   try {
//     const rconConnection = new RconConnection();

//     useUtils(rconConnection);

//     rconConnection.on('authenticated', async () => {
//       await rconConnection.utils.tellRaw('@a', 'Hello World');
//     });

//     rconConnection.connect();
//   } catch (error) {
//     console.error(error);
//   }
// };

// Example of using ScriptServer, which is both JavaServer & RconConnection
(() => {
  try {
    const scriptServer = new ScriptServer({
      command: {
        prefix: '!',
      },
    });

    useEvent(scriptServer.javaServer);
    useCommand(scriptServer.javaServer);
    useUtil(scriptServer.rconConnection);

    scriptServer.javaServer.command('spawn', event => {
      scriptServer.rconConnection.util.tellRaw('Hello world', event.player, {
        color: 'red',
      });
    });

    scriptServer.start();
  } catch (error) {
    console.error(error);
  }
})();
