import { ScriptServer, JavaServer, RconConnection } from '@scriptserver/core';
import { useCommand } from '@scriptserver/command';
import { useEvent } from '@scriptserver/event';
import { useUtil } from '@scriptserver/util';
import { useJson } from '@scriptserver/json';

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

    useEvent(scriptServer.javaServer);
    useCommand(scriptServer.javaServer);
    useUtil(scriptServer.rconConnection);
    useJson(scriptServer);

    scriptServer.javaServer.on('chat', e => console.log('chat', e));
    scriptServer.javaServer.on('command', e => console.log('command', e));
    scriptServer.javaServer.on('achievement', e => console.log('achievement', e));
    scriptServer.javaServer.on('login', e => console.log('login', e));
    scriptServer.javaServer.on('logout', e => console.log('logout', e));
    scriptServer.javaServer.on('start', () => console.log('start'));
    scriptServer.javaServer.on('stop', () => console.log('stop'));

    scriptServer.javaServer.command('spawn', async event => {
      await scriptServer.rconConnection.send(`teleport ${event.player} 0 75 0`);

      await scriptServer.json.set(event.player, 'usedSpawn', Date.now());
      console.log(await scriptServer.json.get(event.player, 'usedSpawn'));

      await scriptServer.rconConnection.util.tellRaw('Poof!', event.player, {
        color: 'green',
      });
    });

    scriptServer.start();
  } catch (error) {
    console.error(error);
  }
})();
