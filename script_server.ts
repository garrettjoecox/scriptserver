import { EventEmitter } from "https://deno.land/std@0.93.0/node/events.ts";
import { JavaServer } from "./java_server.ts";
import { RconConnection } from "./rcon_connection.ts";
import get from "https://deno.land/x/denodash@v0.1.3/src/object/get.ts";
import { Config } from "./config.ts";

export interface ScriptServerConfig {
  flavorSpecific: {
    default: {
      rconRunningRegExp: RegExp;
    };
  };
}

declare module "./config.ts" {
  export interface Config {
    scriptServer: ScriptServerConfig;
  }
}

const DEFAULT_CONFIG: ScriptServerConfig = {
  flavorSpecific: {
    default: {
      rconRunningRegExp: /^\[[\d:]{8}\] \[Server thread\/INFO\]: RCON running/i,
    },
  },
};

export class ScriptServer extends EventEmitter {
  public javaServer: JavaServer;
  public rconConnection: RconConnection;
  public config: Config;

  constructor(config: Partial<Config> = {}) {
    super();
    this.config = { scriptServer: DEFAULT_CONFIG, ...config } as Config;
    this.javaServer = new JavaServer(config);
    this.rconConnection = new RconConnection(config);
  }

  public start() {
    this.javaServer.start();

    const rconListener = (message: string) => {
      if (
        !message.match(
          get(
            this.config,
            `scriptServer.flavorSpecific.${this.config.flavor}.rconRunningRegExp`,
            this.config.scriptServer.flavorSpecific.default.rconRunningRegExp
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
