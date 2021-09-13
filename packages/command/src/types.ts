import { JavaServerEvents, JavaServer, Config } from '@scriptserver/core';

export interface CommandConfig {
  initialized: boolean;
  prefix: string;
  commands: {
    [cmd: string]: CommandCallback[];
  };
}

export interface CommandEvent {
  player: string;
  command: string;
  args: string[];
  timestamp: number;
}

export type CommandCallback = (event: CommandEvent) => void;

declare module '@scriptserver/core/dist/Config' {
  interface Config {
    command: CommandConfig;
  }
}

declare module '@scriptserver/core/dist/JavaServer' {
  interface JavaServerEvents {
    command: CommandCallback;
  }

  interface JavaServer {
    command: (cmd: string, callback: CommandCallback) => void;
  }
}
