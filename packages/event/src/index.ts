import { ScriptServer, ScriptServerEvents } from '@scriptserver/core';
import defaultsDeep from 'lodash.defaultsdeep';

export interface EventConfig {
  flavorSpecific: {
    parseChatEvent(message: string): { player: string; message: string } | undefined;
    parseLoginEvent(message: string): { player: string } | undefined;
    parseLogoutEvent(message: string): { player: string } | undefined;
  };
}

declare module '@scriptserver/core' {
  export interface ScriptServerEvents {
    chat: (event: { player: string; message: string }) => void;
    login: (event: { player: string }) => void;
    logout: (event: { player: string }) => void;
  }

  export interface ScriptServerConfig {
    event: EventConfig;
  }
}

export const DEFAULT_EVENT_CONFIG: EventConfig = {
  flavorSpecific: {
    parseChatEvent(message) {
      const parsed = message.match(/^<(\w+)> (.*)/);
      if (parsed) {
        return {
          player: parsed[1],
          message: parsed[2],
        };
      }
    },
    parseLoginEvent(message) {
      const parsed = message.match(/^(\w+) joined the game$/);
      if (parsed) {
        return {
          player: parsed[1],
        };
      }
    },
    parseLogoutEvent(message) {
      const parsed = message.match(/^(\w+) left the game/);
      if (parsed) {
        return {
          player: parsed[1],
        };
      }
    },
  },
};

const events: [keyof ScriptServerEvents, keyof EventConfig['flavorSpecific']][] = [
  ['chat', 'parseChatEvent'],
  ['login', 'parseLoginEvent'],
  ['logout', 'parseLogoutEvent'],
];

export default (server: ScriptServer) => {
  server.config.event = defaultsDeep(server.config.event, DEFAULT_EVENT_CONFIG);

  server.on('console', (message: string) => {
    const result = events.reduce<null | { event: keyof ScriptServerEvents; payload: any }>(
      (acc, [eventName, methodName]) => {
        if (acc) return acc;

        const parseEvent = server.config.event.flavorSpecific[methodName];
        const matches = parseEvent(message);
        if (matches) return { event: eventName, payload: matches };

        return null;
      },
      null,
    );

    if (result) {
      server.emit(result.event, result.payload);
    }
  });
};
