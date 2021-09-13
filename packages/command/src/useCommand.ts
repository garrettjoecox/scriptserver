import { JavaServer } from '@scriptserver/core';
import { useEvent } from '@scriptserver/event';
import defaultsDeep from 'lodash.defaultsdeep';
import { CommandCallback, CommandConfig } from './types';

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

  useEvent(javaServer);

  const regex = new RegExp(`^${javaServer.config.command.prefix}([\\w]+)\\s?(.*)`, 'i');

  javaServer.on('chat', event => {
    const stripped = event.message.match(regex);
    if (stripped) {
      const command = stripped[1].toLowerCase();
      javaServer.emit('command', {
        player: event.player,
        command,
        args: stripped[2].split(' '),
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
