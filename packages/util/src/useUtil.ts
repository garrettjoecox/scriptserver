import { RconConnection } from '@scriptserver/core';
import defaultsDeep from 'lodash.defaultsdeep';
import get from 'lodash.get';
import { Dimension, UtilConfig } from './types';
import fs from 'fs';
import { promisify } from 'util';
import { join } from 'path';

export function useUtil(rconConnection: RconConnection) {
  const DEFAULT_UTIL_CONFIG: UtilConfig = {
    initialized: false,
    flavorSpecific: {
      default: {
        async isOp(player) {
          if (!player) throw new Error('util.isOp: Please provide player name');
          if (typeof player !== 'string') throw new Error('util.isOp: Player name needs to be a string');

          return readFile(join(process.cwd(), rconConnection.config.javaServer.path, 'ops.json'))
            .catch(() => {
              throw new Error('util.isOp: ops.json not found');
            })
            .then(ops => JSON.parse(ops))
            .then(ops => !!ops.filter((op: { name: string }) => op.name === player).length);
        },

        async isOnline(player) {
          if (!player) throw new Error('util.isOnline: Please provide player name');
          if (typeof player !== 'string') throw new Error('util.isOnline: Player name needs to be a string');

          const result = await rconConnection.send(`data get entity ${player} Dimension`);
          return !result.match(/^No entity was found$/);
        },

        async getOnline() {
          const result = await rconConnection.send('list');
          const online = result.match(/^There are (\d+) of a max of (\d+) players online: (.+)$/);

          if (!online) throw new Error('util.getOnline: Could not parse list command result');

          return {
            online: parseInt(online[1], 10),
            max: parseInt(online[2], 10),
            players: online[3].split(','),
          };
        },

        async tellRaw(message, target = '@a', options = {}) {
          if (!message) throw new Error('util.tellRaw: A message is required');
          if (typeof message !== 'string') throw new Error('util.tellRaw: Message should be a string');
          if (typeof target !== 'string') throw new Error('util.tellRaw: Specified target should be a string');
          if (typeof options !== 'object') throw new Error('util.tellRaw: Options for tellraw should be an object');

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
          if (rawResult.match(/^No entity was found$/)) throw new Error(`util.getEntityData: Invalid target ${target}`);
          const result = rawResult.match(/^(\w+) has the following entity data: (.+)$/)![2];

          return result;
        },

        async getDimension(player) {
          const rawDimension = await this.getEntityData(player, 'Dimension');
          const dimension = rawDimension.replace(/"/g, '');

          if (!dimension) throw new Error('util.getLocation: Could not parse dimension, player may be offline');

          return dimension as Dimension;
        },

        async getLocation(player) {
          if (!player) throw new Error('util.getLocation: Please provide player name');
          if (typeof player !== 'string') throw new Error('util.getLocation: Player name needs to be a string');

          const rawLocation = await this.getEntityData(player, 'Pos');
          const location = rawLocation.match(/\[([-\d.]+)d, ([-\d.]+)d, ([-\d.]+)d\]$/);

          if (!location) throw new Error('util.getLocation: Could not parse location, player may be offline');

          return {
            x: parseFloat(location[1]),
            y: parseFloat(location[2]),
            z: parseFloat(location[3]),
            dimension: await this.getDimension(player),
          };
        },

        async teleport(target, location) {
          if (!target) throw new Error('util.teleport: Please a target');
          if (typeof target !== 'string') throw new Error('util.teleport: Target needs to be a string');
          if (
            !location ||
            location.x === undefined ||
            location.y === undefined ||
            location.z === undefined ||
            location.dimension === undefined
          ) {
            throw new Error('util.teleport: Needs x, y, z and dimension');
          }

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

        wait(time) {
          return new Promise(resolve => setTimeout(resolve, time));
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

function readFile(file: string) {
  return promisify(fs.readFile)(file, 'utf8');
}
