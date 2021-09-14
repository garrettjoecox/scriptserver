import { ScriptServer, JavaServer, RconConnection } from '@scriptserver/core';
import defaultsDeep from 'lodash.defaultsdeep';
import { join } from 'path';
import fs from 'fs';

export interface JsonConfig {
  initialized: boolean;
  path: string;
}

declare module '@scriptserver/core/dist/Config' {
  interface Config {
    json: JsonConfig;
  }
}

declare module '@scriptserver/core/dist/JavaServer' {
  interface JavaServer {
    json: {
      get: <T = any>(path: string, key?: string) => Promise<T>;
      set: <T = any>(path: string, key: string, value: T) => Promise<T>;
    };
  }
}

declare module '@scriptserver/core/dist/RconConnection' {
  interface RconConnection {
    json: {
      get: <T = any>(path: string, key?: string) => Promise<T>;
      set: <T = any>(path: string, key: string, value: T) => Promise<T>;
    };
  }
}

declare module '@scriptserver/core/dist/ScriptServer' {
  interface ScriptServer {
    json: {
      get: <T = any>(path: string, key?: string) => Promise<T>;
      set: <T = any>(path: string, key: string, value: T) => Promise<T>;
    };
  }
}

export const DEFAULT_JSON_CONFIG: JsonConfig = {
  initialized: false,
  path: join(process.cwd(), './json'),
};

export function useJson(server: ScriptServer | JavaServer | RconConnection) {
  if (server.config?.json?.initialized) {
    return;
  }

  defaultsDeep(server.config, { json: DEFAULT_JSON_CONFIG });
  server.config.json.initialized = true;

  // ensure folder at path exists
  if (!fs.existsSync(server.config.json.path)) {
    fs.mkdirSync(server.config.json.path);
  }

  server.json = {
    get: async <T = any>(path: string, key?: string): Promise<T> => {
      const filePath = join(server.config.json.path, path.toLowerCase() + '.json');

      return readJson(filePath).then(data => (key ? data[key] : data));
    },
    set: async <T = any>(path: string, key: string, value: T): Promise<T> => {
      const filePath = join(server.config.json.path, path.toLowerCase() + '.json');

      return readJson(filePath).then(data => {
        data[key] = value;
        return writeJson(filePath, data);
      });
    },
  };

  if (server instanceof ScriptServer) {
    server.javaServer.json = server.json;
    server.rconConnection.json = server.json;
  }
}

function readJson<T = any>(path: string): Promise<T> {
  return new Promise(resolve => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) resolve({} as any);
      else resolve(JSON.parse(data));
    });
  });
}

function writeJson<T = any>(path: string, data: T): Promise<T> {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, JSON.stringify(data, null, 4), err => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}
