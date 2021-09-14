import { ScriptServer, JavaServer, RconConnection } from '@scriptserver/core';
import { useCommand } from '@scriptserver/command';
import { useEvent } from '@scriptserver/event';
import { useUtil } from '@scriptserver/util';
import { useJson } from '@scriptserver/json';
import { useEssentials } from '@scriptserver/essentials';

// Example of only using the JavaServer & Plugins
() => {
  try {
    const javaServer = new JavaServer();

    useEvent(javaServer);
    useCommand(javaServer);

    javaServer.command('head', event => {
      javaServer.send(`say ${event.player} issued "head" command`);
    });

    javaServer.start();
  } catch (error) {
    console.error(error);
  }
};

// Example of only using the RconConnection & Plugins
() => {
  try {
    const rconConnection = new RconConnection();

    useUtil(rconConnection);

    rconConnection.on('connected', async () => {
      await rconConnection.util.tellRaw('@a', 'Hello World');
    });

    rconConnection.connect();
  } catch (error) {
    console.error(error);
  }
};

// Example of using ScriptServer, which is both JavaServer & RconConnection
(() => {
  try {
    const scriptServer = new ScriptServer({
      javaServer: {
        jar: 'vanilla.jar',
        path: './server',
      },
    });

    useEssentials(scriptServer);

    scriptServer.start();
  } catch (error) {
    console.error(error);
  }
})();
