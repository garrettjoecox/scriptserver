import { JavaServer, Config, JavaServerEvents } from '@scriptserver/core';
import defaultsDeep from 'lodash.defaultsdeep';

export interface CommandConfig {
  initialized: boolean;
  prefix: string;
  commands: {
    [cmd: string]: CommandCallback[];
  };
}

interface CommandEvent {
  player: string;
  command: string;
  args: string[];
  timestamp: number;
}

type CommandCallback = (event: CommandEvent) => void;

declare module '@scriptserver/core' {
  export interface Config {
    command: CommandConfig;
  }

  export interface JavaServerEvents {
    command: CommandCallback;
  }

  export interface JavaServer {
    command: (cmd: string, callback: CommandCallback) => void;
  }
}

export const DEFAULT_COMMAND_CONFIG: CommandConfig = {
  initialized: false,
  prefix: '~',
  commands: {},
};

export function useCommand(javaServer: JavaServer) {
  if (javaServer.config?.command?.initialized) {
    return;
  }

  defaultsDeep(javaServer.config, { command: DEFAULT_COMMAND_CONFIG });
  javaServer.config.command.initialized = true;

  const regex = new RegExp(`<(\w+)> ${javaServer.config.command.prefix}([\\w]+)\\s?(.*)`, 'i');

  javaServer.on('console', consoleLine => {
    const stripped = consoleLine.match(regex);
    if (stripped) {
      const command = stripped[2].toLowerCase();
      javaServer.emit('command', {
        player: stripped[1],
        command,
        args: stripped[3].split(' '),
        timestamp: Date.now(),
      });
    }
  });

  javaServer.on('command', event => {
    if (javaServer.config.command.commands.hasOwnProperty(event.command)) {
      javaServer.config.command.commands[event.command].forEach(callback => {
        Promise.resolve()
          .then(() => callback(event))
          .catch(e => console.error(e));
      });
    }
  });

  javaServer.command = (cmd: string, callback: CommandCallback) => {
    cmd = cmd.toLowerCase();
    javaServer.config.command.commands[cmd] = javaServer.config.command.commands[cmd] || [];
    javaServer.config.command.commands[cmd].push(callback);
  };
}
