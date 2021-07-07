import { ScriptServer, ScriptServerEvents, ScriptServerConfig, ScriptServerExt } from '@scriptserver/core';
import defaultsDeep from 'lodash.defaultsdeep';

export interface CommandConfig {
  prefix: string;
}

interface EventPayload {
  player: string;
  command: string;
  args?: string[];
}

type EventHandler = (event: EventPayload) => void;

declare module '@scriptserver/core' {
  export interface ScriptServerEvents {
    command: EventHandler;
  }

  export interface ScriptServerConfig {
    command: CommandConfig;
  }

  export interface ScriptServerExt {
    command(command: string, callback: EventHandler): void;
  }
}

export const DEFAULT_COMMAND_CONFIG: CommandConfig = {
  prefix: '~',
};

export default (server: ScriptServer) => {
  server.config.command = defaultsDeep(server.config.command, DEFAULT_COMMAND_CONFIG);

  const regex = new RegExp(`^${server.config.command.prefix}([\\w]+)\\s?(.*)`, 'i');
  const commands: {
    [commandName: string]: EventHandler[];
  } = {};

  server.ext.command = (command, callback) => {
    command = command.toLowerCase();
    commands[command] = commands[command] || [];
    commands[command].push(callback);
  };

  // @ts-ignore
  server.on('chat', event => {
    const stripped: null | string[] = event.message.match(regex);
    if (stripped) {
      const command = stripped[1].toLowerCase();
      server.emit('command', {
        player: event.player,
        command,
        args: stripped[2].split(' '),
      });
    }
  });

  server.on('command', event => {
    if (commands.hasOwnProperty(event.command)) {
      commands[event.command].forEach(callback => {
        Promise.resolve()
          .then(() => callback(event))
          .catch(error => console.error(error));
      });
    }
  });
};
