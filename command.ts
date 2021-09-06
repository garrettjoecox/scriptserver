import { Config } from "./config.ts";
import { JavaServer, JavaServerEvents } from "./java_server.ts";
import get from "https://deno.land/x/denodash@v0.1.3/src/object/get.ts";
import { useEvents } from "./events.ts";

interface CommandEvent {
  player: string;
  command: string;
  args: string[];
  timestamp: number;
}

type CommandCallback = (event: CommandEvent) => void;

export interface CommandConfig {
  initialized: boolean;
  prefix: string;
  commands: {
    [cmd: string]: CommandCallback[];
  };
  commandFunc?: (cmd: string, callback: CommandCallback) => void;
}

declare module "./config.ts" {
  export interface Config {
    command: CommandConfig;
  }
}

declare module "./java_server.ts" {
  export interface JavaServerEvents {
    command: CommandCallback;
  }
}

const DEFAULT_CONFIG: CommandConfig = {
  initialized: false,
  prefix: "~",
  commands: {},
};

export function useCommand(javaServer: JavaServer) {
  if (javaServer.config?.command?.initialized) {
    return javaServer.config.command.commandFunc!;
  }

  useEvents(javaServer);

  // @ts-ignore
  javaServer.config = { command: DEFAULT_CONFIG, ...javaServer.config };
  javaServer.config.command.initialized = true;

  const regex = new RegExp(
    `^${javaServer.config.command.prefix}([\\w]+)\\s?(.*)`,
    "i"
  );

  javaServer.on("chat", (event) => {
    const stripped = event.message.match(regex);
    if (stripped) {
      const command = stripped[1].toLowerCase();
      javaServer.emit("command", {
        player: event.player,
        command,
        args: stripped[2].split(" "),
        timestamp: Date.now(),
      });
    }
  });

  javaServer.on("command", (event) => {
    if (javaServer.config.command.commands.hasOwnProperty(event.command)) {
      javaServer.config.command.commands[event.command].forEach((callback) => {
        Promise.resolve()
          .then(() => callback(event))
          .catch((e) => console.error(e));
      });
    }
  });

  javaServer.config.command.commandFunc = (
    cmd: string,
    callback: CommandCallback
  ) => {
    cmd = cmd.toLowerCase();
    javaServer.config.command.commands[cmd] =
      javaServer.config.command.commands[cmd] || [];
    javaServer.config.command.commands[cmd].push(callback);
  };

  return javaServer.config.command.commandFunc;
}
