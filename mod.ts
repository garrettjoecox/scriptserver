import { ScriptServer } from "./script_server.ts";

const scriptServer = new ScriptServer();

scriptServer.start();

scriptServer.on("start", async () => {
  console.log(await scriptServer.send("help"));
});
