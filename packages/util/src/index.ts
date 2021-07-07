import { ScriptServer } from '@scriptserver/core';
import defaultsDeep from 'lodash.defaultsdeep';

export interface UtilConfig {}

declare module '@scriptserver/core' {
  interface ScriptServerConfig {
    util: UtilConfig;
  }

  interface ScriptServer {
    util: {
      tellRaw(message: string, target: string, options: { text?: string; color?: string }): void;
    };
  }
}

const DEFAULT_UTIL_CONFIG: UtilConfig = {};

export default (server: ScriptServer) => {
  server.config.util = defaultsDeep(server.config.util, DEFAULT_UTIL_CONFIG);

  server.util = {
    tellRaw(message, target = '@a', options = {}) {
      if (typeof target !== 'string')
        return Promise.reject(new Error('util.tellRaw: Specified target should be a string'));
      if (typeof options !== 'object')
        return Promise.reject(new Error('util.tellRaw: Options for tellraw should be an object'));

      options.text = typeof message === 'string' ? message : JSON.stringify(message);
      return server.send(`tellraw ${target} ${JSON.stringify(options)}`);
    },
  };
};
