import { ScriptServer, JavaServer, RconConnection } from '@scriptserver/core';
import { useCommand } from '@scriptserver/command';
import { useEvent } from '@scriptserver/event';
import { useUtil } from '@scriptserver/util';

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
      command: {
        prefix: '!',
      },
      event: {
        flavorSpecific: {},
      },
      util: {
        flavorSpecific: {},
      },
    });

    useEvent(scriptServer.javaServer);
    useCommand(scriptServer.javaServer);
    useUtil(scriptServer.rconConnection);

    scriptServer.javaServer.on('chat', e => console.log('chat', e));
    scriptServer.javaServer.on('command', e => console.log('command', e));
    scriptServer.javaServer.on('achievement', e => console.log('achievement', e));
    scriptServer.javaServer.on('login', e => console.log('login', e));
    scriptServer.javaServer.on('logout', e => console.log('logout', e));
    scriptServer.javaServer.on('start', () => console.log('start'));
    scriptServer.javaServer.on('stop', () => console.log('stop'));

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
