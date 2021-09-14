# @scriptserver/core

[![](http://i.imgur.com/zhptNme.png)](https://github.com/garrettjoecox/scriptserver/tree/next)

#### FYI: This package is an addon for ScriptServer and requires ScriptServer to be set up, please see [here](https://github.com/garrettjoecox/scriptserver/tree/next) for more information.

## Class: ScriptServer

ScriptServer is simply a combination of [JavaServer](#class-javaserver) and [RconConnection](#class-rconconnection), entirely for convenience.

```ts
import { ScriptServer } from '@scriptserver/core';
```

### `new ScriptServer(config: Config)`

- config: [Config](#interface-config)

### `scriptserver.start()`

Starts the javaServer and attempts to connect with the rconConnection

### `scriptserver.stop()`

Disconnects the rconConnection and stops the javaServer

## Class: JavaServer

JavaServer is a class that manages the java process itself, and captures the java process STDOUT.

```ts
import { JavaServer } from '@scriptserver/core';
```

### `new JavaServer(config: Config)`

- config: [Config](#interface-config)
  - javaServer
    - jar: `string`
    - args: `string[]`
    - path: `string`
    - pipeStdout: `boolean`
    - pipeStdin: `boolean`
    - flavorSpecific
      - [flavor name]
        - startedRegExp: `RegExp`
        - stoppedRegExp: `RegExp`

```ts
const javaServer = new JavaServer({
  flavor: 'spigot',
  javaServer: {
    jar: 'spigot.jar',
    flavorSpecific: {
      spigot: {
        startedRegExp: /.../i,
        stoppedRegExp: /.../i,
      },
    },
  },
});
```

### `javaServer.start(): void`

### `javaServer.stop(): void`

### `javaServer.send(message: string): void`

Sends an input to the java process STDIN

**Note** - Usually you should prefer RconConnection.send instead of using this, as you cannot reliably determine what the result of a sent message here is. Only use this if you are not using an RconConnection.

### `javaServer.on('start', () => void)`

### `javaServer.on('stop', () => void)`

### `javaServer.on('console', (message: string) => void)`

## Class: RconConnection

RconConnection is a class that manages the rcon connection to the java server. This requires that the RCON connection is enabled in the server's `server.properties`

```ts
import { RconConnection } from '@scriptserver/core';
```

### `new RconConnection(config: Config)`

- config: [Config](#interface-config)
  - rconConnection
    - host: `string`
    - port: `number`
    - password: `string`
    - buffer: `number`

```ts
const rconConnection = new RconConnection({
  rconConnection: {
    password: 'password',
  },
});
```

### `rconConnection.connect(): void`

### `rconConnection.disconnect(): void`

### `rconConnection.send(message: string): Promise<string>`

### `rconConnection.on('connected', () => void)`

### `rconConnection.on('disconnected', () => void)`

## Interface: `Config`

The config object is shared across all modules in ScriptServer, specific keys at the root level determine what module the config is for. The shape of the Config is the same regardless of which class you are using.

```ts

const config = {
  myPluginConfig: {...},
  rconConnection: {...},
  javaServer: {...},
}

new ScriptServer(config);
new JavaServer(config);
new RconConnection(config);
```

### Extending config for plugins

If you are creating a plugin you might want to add type-safety to your config object, you can do that by adding the following to your module:

```ts
import { Config } from '@scriptserver/core';

interface CustomPluginConfig {
  etc: string;
}

declare module '@scriptserver/core/dist/Config' {
  interface Config {
    customPlugin: CustomPluginConfig;
  }
}
```

If all else fails, just refer to the official plugins and how they are extending the configuration.

**Note** - this is purely for typescript and type-safety, this is not required for making a plugin.
