import { JavaServer, JavaServerEvents, Config } from '@scriptserver/core';
import defaultsDeep from 'lodash.defaultsdeep';
import get from 'lodash.get';

export interface EventConfig {
  initialized: boolean;
  flavorSpecific: {
    [flavor: string]: {
      parseChatEvent: (
        consoleOutput: string,
      ) => {
        player: string;
        message: string;
      } | void;
      parseLoginEvent: (
        consoleOutput: string,
      ) => {
        player: string;
        ip: string;
      } | void;
      parseLogoutEvent: (
        consoleOutput: string,
      ) => {
        player: string;
        reason: string;
      } | void;
      parseAchievementEvent: (
        consoleOutput: string,
      ) => {
        player: string;
        achievement: string;
      } | void;
      parseStartEvent: (consoleOutput: string) => {} | void;
      parseStopEvent: (consoleOutput: string) => {} | void;
    };
  };
}

declare module '@scriptserver/core' {
  export interface JavaServerEvents {
    chat: (event: { player: string; message: string; timestamp: number }) => void;
    login: (event: { player: string; ip: string; timestamp: number }) => void;
    logout: (event: { player: string; reason: string; timestamp: number }) => void;
    achievement: (event: { player: string; achievement: string; timestamp: number }) => void;
    start: (event: { timestamp: number }) => void;
    stop: (event: { timestamp: number }) => void;
  }

  export interface Config {
    event: EventConfig;
  }
}

const DEFAULT_EVENT_CONFIG: EventConfig = {
  initialized: false,
  flavorSpecific: {
    default: {
      parseChatEvent(consoleOutput) {
        const parsed = consoleOutput.match(/^\[[\d:]{8}\] \[Server thread\/INFO\]: <(\w+)> (.*)/i);
        if (parsed) {
          return {
            player: parsed[1] as string,
            message: parsed[2] as string,
          };
        }
      },
      parseLoginEvent(string) {
        const parsed = string.match(/^\[[\d:]{8}\] \[Server thread\/INFO\]: (\w+)\[\/([\d.:]+)\] logged in/);
        if (parsed) {
          return {
            player: parsed[1],
            ip: parsed[2],
          };
        }
      },
      parseLogoutEvent(string) {
        const parsed = string.match(/^\[[\d:]{8}\] \[Server thread\/INFO\]: (\w+) lost connection: (.+)/);
        if (parsed) {
          return {
            player: parsed[1],
            reason: parsed[2],
          };
        }
      },
      parseAchievementEvent(string) {
        const parsed = string.match(
          /^\[[\d:]{8}\] \[Server thread\/INFO\]: (\w+) has made the advancement \[([\w\s]+)\]/,
        );
        if (parsed) {
          return {
            player: parsed[1],
            achievement: parsed[2],
          };
        }
      },
      parseStartEvent(string) {
        const parsed = string.match(/^\[[\d:]{8}\] \[Server thread\/INFO\]: Done/);
        if (parsed) {
          return {};
        }
      },
      parseStopEvent(string) {
        const parsed = string.match(/^\[[\d:]{8}\] \[Server thread\/INFO\]: Stopping server/);
        if (parsed) {
          return {};
        }
      },
    },
  },
};

const EVENTS_MAP: [keyof JavaServerEvents, keyof EventConfig['flavorSpecific']][] = [
  ['chat', 'parseChatEvent'],
  ['login', 'parseLoginEvent'],
  ['logout', 'parseLogoutEvent'],
  ['achievement', 'parseAchievementEvent'],
  ['start', 'parseStartEvent'],
  ['stop', 'parseStopEvent'],
];

export function useEvent(javaServer: JavaServer) {
  if (javaServer.config?.event?.initialized) {
    return;
  }

  defaultsDeep(javaServer.config, { event: DEFAULT_EVENT_CONFIG });
  javaServer.config.event.initialized = true;

  javaServer.on('console', consoleLine => {
    const result = EVENTS_MAP.reduce<null | {
      event: keyof JavaServerEvents;
      payload: any;
    }>((acc, event) => {
      if (acc) return acc;

      const parseEvent = get(
        javaServer.config.event,
        `flavorSpecific.${javaServer.config.flavor}.${event[1]}`,
        // @ts-expect-error
        javaServer.config.event.flavorSpecific.default[event[1]],
      );
      const matches = parseEvent(consoleLine);
      if (matches) return { event: event[0], payload: matches };

      return null;
    }, null);

    if (result) {
      result.payload.timestamp = Date.now();
      javaServer.emit(result.event, result.payload);
    }
  });
}
