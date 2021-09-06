import { Config } from "./config.ts";
import { RconConnection } from "./rcon_connection.ts";
import get from "https://deno.land/x/denodash@v0.1.3/src/object/get.ts";
import { defaultsDeep } from "./defaults_deep.ts";

export type Dimension =
  | "minecraft:overworld"
  | "minecraft:the_nether"
  | "minecraft:the_end";

interface Location {
  x: number;
  y: number;
  z: number;
  dimension: Dimension;
}

export interface UtilsConfig {
  initialized: boolean;
  flavorSpecific: {
    default: {
      tellRaw: (
        message: string,
        target?: string,
        options?: Record<string, string>
      ) => void;
      getEntityData: (
        target?: string,
        path?: string,
        scale?: number
      ) => Promise<string>;
      getDimension: (player: string) => Promise<Dimension>;
      getLocation: (player: string) => Promise<Location>;
      teleport: (target: string, location: Location) => Promise<void>;
    };
  };
}

declare module "./config.ts" {
  export interface Config {
    utils: UtilsConfig;
  }
}

declare module "./rcon_connection.ts" {
  export interface RconConnection {
    utils: UtilsConfig["flavorSpecific"]["default"];
  }
}

export function useUtils(rconConnection: RconConnection) {
  if (rconConnection.config.utils?.initialized) {
    return;
  }

  defaultsDeep(rconConnection.config, {
    utils: {
      initialized: false,
      flavorSpecific: {
        default: {
          tellRaw(message, target = "@a", options = {}) {
            options.text =
              typeof message === "string" ? message : JSON.stringify(message);
            return rconConnection.send(
              `tellraw ${target} ${JSON.stringify(options)}`
            );
          },
          async getEntityData(target = "@a", path = "", scale) {
            let cmd = `data get entity ${target}`;
            if (path) {
              cmd += ` ${path}`;
            }
            if (path && scale !== undefined) {
              cmd += ` ${scale}`;
            }

            const rawResult = await rconConnection.send(cmd);
            if (rawResult.match(/^No entity was found$/))
              throw new Error(`Invalid target ${target}`);
            const result = rawResult.match(
              /^(\w+) has the following entity data: (.+)$/
            )![2];

            return result;
          },
          async getDimension(player) {
            const rawDimension = await this.getEntityData(player, "Dimension");
            const dimension = rawDimension.replaceAll('"', "");

            return dimension;
          },
          async getLocation(player) {
            const rawLocation = await this.getEntityData(player, "Pos");
            const location = rawLocation.match(
              /\[([-\d.]+)d, ([-\d.]+)d, ([-\d.]+)d\]$/
            );

            return {
              x: parseFloat(location![1]),
              y: parseFloat(location![2]),
              z: parseFloat(location![3]),
              dimension: await this.getDimension(player),
            };
          },
          async teleport(target, location) {
            await rconConnection.send(
              `execute in ${location.dimension} run tp ${target} ${location.x} ${location.y} ${location.z}`
            );
            await rconConnection.send(
              `execute in ${location.dimension} run particle cloud ${location.x} ${location.y} ${location.z} 1 1 1 0.1 100 force`
            );
            await rconConnection.send(
              `execute in ${location.dimension} run playsound entity.item.pickup master @a ${location.x} ${location.y} ${location.z} 10 1 1`
            );
          },
        },
      },
    } as UtilsConfig,
  });

  rconConnection.config.utils.initialized = true;

  rconConnection.utils = get(
    rconConnection.config.utils,
    `flavorSpecific.${rconConnection.config.flavor}`,
    rconConnection.config.utils.flavorSpecific.default
  );
}
