# scriptserver

[![](http://i.imgur.com/zhptNme.png)](https://github.com/garrettjoecox/scriptserver/tree/next)

#### FYI: This package is an addon for ScriptServer and requires ScriptServer to be set up, please see [here](https://github.com/garrettjoecox/scriptserver/tree/next) for more information.

## `useJson(server: ScriptServer | JavaServer | RconConnection)`

```ts
import { ScriptServer, RconConnection, JavaServer } from '@scriptserver/core';
import { useJson } from '@scriptserver/json';

const scriptServer = new ScriptServer();
useJson(scriptServer.rconConnection);
// Or
const rconConnection = new RconConnection();
useJson(rconConnection);
// Or
const javaServer = new JavaServer();
useJson(javaServer);
```

## Class: ScriptServer | JavaServer | RconConnection

This module adds the json methods to all of the three servers, depending on what is passed in to the `useJson()` method

### `server.json.get: (path: string, key?: string) => Promise<T>`

### `server.json.set: (path: string, key: string, value: T) => Promise<T>`

## Interface: `Config`

These configuration options are here to override as needed for flavors, if you are having trouble getting the utils to work in your given flavor of server, try overriding these.

- config: [Config](#interface-config)
  - json
    - path: `string`
