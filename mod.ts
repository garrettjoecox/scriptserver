import { JavaServer } from "./java_server.ts";
import { RconConnection } from "./rcon_connection.ts";
import { ScriptServer } from "./script_server.ts";
import { useEvents } from "./events.ts";
import { useCommand } from "./command.ts";
import { useUtils } from "./utils.ts";

// Example of only using the JavaServer & Plugins
() => {
  try {
    const javaServer = new JavaServer();

    useEvents(javaServer);
    useCommand(javaServer);

    javaServer.command("head", (event) => {
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

    useUtils(rconConnection);

    rconConnection.on("authenticated", async () => {
      await rconConnection.utils.tellRaw("@a", "Hello World");
    });

    rconConnection.connect();
  } catch (error) {
    console.error(error);
  }
};

// Example of using ScriptServer, which is both JavaServer & RconConnection
() => {
  try {
    const scriptServer = new ScriptServer({
      command: {
        prefix: "!",
      },
    });

    useEvents(scriptServer.javaServer);
    useCommand(scriptServer.javaServer);
    useUtils(scriptServer.rconConnection);

    scriptServer.javaServer.command("spawn", (event) => {
      scriptServer.rconConnection.utils.tellRaw("Hello world", event.player, {
        color: "red",
      });
    });

    console.log(scriptServer.config);

    // scriptServer.start();
  } catch (error) {
    console.error(error);
  }
};
