import { ScriptServer } from "./script_server.ts";
import { useEvents } from "./events.ts";
import { useCommand } from "./command.ts";

(() => {
  try {
    const scriptServer = new ScriptServer();

    useEvents(scriptServer.javaServer);
    const command = useCommand(scriptServer.javaServer);

    scriptServer.javaServer.on("command", (event) => {
      console.log("command", event);
    });

    command("head", (event) => {
      console.log("head", event);
    });

    scriptServer.start();
  } catch (error) {
    console.error(error);
  }
})();
