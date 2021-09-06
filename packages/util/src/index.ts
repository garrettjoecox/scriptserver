import { ScriptServer, Config, RconConnection } from '@scriptserver/core';
import defaultsDeep from 'lodash.defaultsdeep';
import get from 'lodash.get';

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

declare module '@scriptserver/core' {
  export interface Config {
    util: UtilConfig;
  }

  export interface RconConnection {
    util: UtilConfig['flavorSpecific']['default'];
  }
}

export function useUtil(rconConnection: RconConnection) {
  const DEFAULT_UTIL_CONFIG: UtilConfig = {
    initialized: false,
    flavorSpecific: {
      default: {
        tellRaw(message, target = '@a', options = {}) {
          options.text = typeof message === 'string' ? message : JSON.stringify(message);
          return rconConnection.send(`tellraw ${target} ${JSON.stringify(options)}`);
        },
        async getEntityData(target = '@a', path = '', scale) {
          let cmd = `data get entity ${target}`;
          if (path) {
            cmd += ` ${path}`;
          }
          if (path && scale !== undefined) {
            cmd += ` ${scale}`;
          }

          const rawResult = await rconConnection.send(cmd);
          if (rawResult.match(/^No entity was found$/)) throw new Error(`Invalid target ${target}`);
          const result = rawResult.match(/^(\w+) has the following entity data: (.+)$/)![2];

          return result;
        },
        async getDimension(player) {
          const rawDimension = await this.getEntityData(player, 'Dimension');
          const dimension = rawDimension.replace(/"/g, '');

          return dimension as Dimension;
        },
        async getLocation(player) {
          const rawLocation = await this.getEntityData(player, 'Pos');
          const location = rawLocation.match(/\[([-\d.]+)d, ([-\d.]+)d, ([-\d.]+)d\]$/);

          return {
            x: parseFloat(location![1]),
            y: parseFloat(location![2]),
            z: parseFloat(location![3]),
            dimension: await this.getDimension(player),
          };
        },
        async teleport(target, location) {
          await rconConnection.send(
            `execute in ${location.dimension} run tp ${target} ${location.x} ${location.y} ${location.z}`,
          );
          await rconConnection.send(
            `execute in ${location.dimension} run particle cloud ${location.x} ${location.y} ${location.z} 1 1 1 0.1 100 force`,
          );
          await rconConnection.send(
            `execute in ${location.dimension} run playsound entity.item.pickup master @a ${location.x} ${location.y} ${location.z} 10 1 1`,
          );
        },
      },
    },
  };

  defaultsDeep(rconConnection.config, {
    util: DEFAULT_UTIL_CONFIG,
  });

  rconConnection.config.util.initialized = true;

  rconConnection.util = get(
    rconConnection.config.util,
    `flavorSpecific.${rconConnection.config.flavor}`,
    rconConnection.config.util.flavorSpecific.default,
  );
}
