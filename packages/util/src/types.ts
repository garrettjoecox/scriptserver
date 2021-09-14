import { Config, RconConnection } from '@scriptserver/core';

export type Dimension = 'minecraft:overworld' | 'minecraft:the_nether' | 'minecraft:the_end';

export interface Location {
  x: number;
  y: number;
  z: number;
  dimension: Dimension;
}

export interface UtilConfig {
  initialized: boolean;
  flavorSpecific: {
    [flavor: string]: {
      isOp: (player: string) => Promise<boolean>;
      isOnline: (player: string) => Promise<boolean>;
      tellRaw: (message: string, target?: string, options?: Record<string, string>) => Promise<string>;
      getEntityData: (target?: string, path?: string, scale?: number) => Promise<string>;
      getDimension: (player: string) => Promise<Dimension>;
      getLocation: (player: string) => Promise<Location>;
      getOnline: () => Promise<{ online: number; max: number; players: string[] }>;
      teleport: (target: string, location: Location) => Promise<void>;
      wait: (ms: number) => Promise<void>;
    };
  };
}

declare module '@scriptserver/core/dist/Config' {
  interface Config {
    util: UtilConfig;
  }
}

declare module '@scriptserver/core/dist/RconConnection' {
  interface RconConnection {
    util: UtilConfig['flavorSpecific']['default'];
  }
}
