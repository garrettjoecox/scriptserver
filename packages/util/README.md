# @scriptserver/util

[![](http://i.imgur.com/zhptNme.png)](https://github.com/garrettjoecox/scriptserver/tree/next)

#### FYI: This package is an addon for ScriptServer and requires ScriptServer to be set up, please see [here](https://github.com/garrettjoecox/scriptserver/tree/next) for more information.

## `useUtil(rconConnection: RconConnection)`

```ts
import { ScriptServer, RconConnection } from '@scriptserver/core';
import { useUtil } from '@scriptserver/util';

const rconConnection = new RconConnection();
useUtil(rconConnection);
// Or
const scriptServer = new ScriptServer();
useUtil(scriptServer.rconConnection);
```

## Class: RconConnection

This module does not export RconConnection, but extends it

### `rconConnection.util.isOp: (player: string) => Promise<boolean>`

### `rconConnection.util.isOnline: (player: string) => Promise<boolean>`

### `rconConnection.util.tellRaw: (message: string, target?: string, options?: Record<string, string>) => void`

### `rconConnection.util.getEntityData: (target?: string, path?: string, scale?: number) => Promise<string>`

### `rconConnection.util.getDimension: (player: string) => Promise<Dimension>`

### `rconConnection.util.getLocation: (player: string) => Promise<Location>`

### `rconConnection.util.getOnline: () => Promise<{ online: number; max: number; players: string[] }>`

### `rconConnection.util.teleport: (target: string, location: Location) => Promise<void>`

### `rconConnection.util.wait: (ms: number) => Promise<void>`

## Interface: `Config`

These configuration options are here to override as needed for flavors, if you are having trouble getting the utils to work in your given flavor of server, try overriding these.

- config: [Config](#interface-config)
  - util
    - flavorSpecific
      - [flavor name]
        - isOp: `(player: string) => Promise<boolean>`
        - isOnline: `(player: string) => Promise<boolean>`
        - tellRaw: `(message: string, target?: string, options?: Record<string, string>) => void`
        - getEntityData: `(target?: string, path?: string, scale?: number) => Promise<string>`
        - getDimension: `(player: string) => Promise<Dimension>`
        - getLocation: `(player: string) => Promise<Location>`
        - getOnline: `() => Promise<{ online: number; max: number; players: string[] }>`
        - teleport: `(target: string, location: Location) => Promise<void>`
        - wait: `(ms: number) => Promise<void>`
