import { EventEmitter } from "https://deno.land/std@0.93.0/node/events.ts";
import { JavaServer, JavaServerConfig } from "./java_server.ts";
import { RconConnection, RconConnectionConfig } from "./rcon_connection.ts";
import get from "https://deno.land/x/denodash@v0.1.3/src/object/get.ts";

export interface ScriptServerConfig {
  flavor: string;
  core: {
    java: JavaServerConfig;
    rcon: RconConnectionConfig;
    flavorSpecific: {
      default: {
        rconRunning: RegExp;
      };
    };
  };
}

export class ScriptServer extends EventEmitter {
  private javaServer: JavaServer;
  private rconConnection: RconConnection;
  private config: ScriptServerConfig = {
    flavor: "default",
    core: {
      java: {
        jar: "server.jar",
        args: ["-Xmx1024M", "-Xms1024M"],
        path: "./server",
        pipeStdout: true,
        pipeStdin: true,
      },
      rcon: {
        host: "localhost",
        rconPort: 25575,
        rconPassword: "0000",
        rconBuffer: 100,
      },
      flavorSpecific: {
        default: {
          rconRunning: /^\[[\d:]{8}\] \[Server thread\/INFO\]: RCON running/i,
        },
      },
    },
  };

  constructor(config: Partial<ScriptServerConfig> = {}) {
    super();
    Object.assign(this.config, config);
    this.javaServer = new JavaServer(config?.core?.java);
    this.rconConnection = new RconConnection(config?.core?.rcon);
  }

  public start() {
    this.javaServer.start();

    const rconListener = (message: string) => {
      if (
        !message.match(
          get(
            this.config,
            `this.config.core.flavorSpecific.${this.config.flavor}.rconRunning`,
            this.config.core.flavorSpecific.default.rconRunning
          )
        )
      ) {
        return;
      }

      this.rconConnection.once("authenticated", () => {
        this.emit("start");
      });

      this.rconConnection.connect();

      this.javaServer.removeListener("console", rconListener);
    };

    this.javaServer.addListener("console", rconListener);
    this.javaServer.addListener("console", (message: string) =>
      this.emit("console", message)
    );
  }

  public stop() {
    this.rconConnection.disconnect();
    this.javaServer.stop();
  }

  public send(message: string) {
    return this.rconConnection.send(message);
  }
}
