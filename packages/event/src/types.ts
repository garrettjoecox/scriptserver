import { JavaServerEvents, Config } from '@scriptserver/core';

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
    };
  };
}

declare module '@scriptserver/core/dist/JavaServer' {
  interface JavaServerEvents {
    chat: (event: { player: string; message: string; timestamp: number }) => void;
    login: (event: { player: string; ip: string; timestamp: number }) => void;
    logout: (event: { player: string; reason: string; timestamp: number }) => void;
    achievement: (event: { player: string; achievement: string; timestamp: number }) => void;
  }
}

declare module '@scriptserver/core/dist/Config' {
  interface Config {
    event: EventConfig;
  }
}
