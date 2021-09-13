import { Config, RconConnection } from '@scriptserver/core';

export type Dimension = 'minecraft:overworld' | 'minecraft:the_nether' | 'minecraft:the_end';

interface Location {
  x: number;
  y: number;
  z: number;
  dimension: Dimension;
}

export interface UtilConfig {
  initialized: boolean;
  flavorSpecific: {
    [flavor: string]: {
      tellRaw: (message: string, target?: string, options?: Record<string, string>) => void;
      getEntityData: (target?: string, path?: string, scale?: number) => Promise<string>;
      getDimension: (player: string) => Promise<Dimension>;
      getLocation: (player: string) => Promise<Location>;
      teleport: (target: string, location: Location) => Promise<void>;
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
