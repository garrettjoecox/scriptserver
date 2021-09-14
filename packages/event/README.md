# @scriptserver/event

[![](http://i.imgur.com/zhptNme.png)](https://github.com/garrettjoecox/scriptserver/tree/master)

#### FYI: This package is an addon for ScriptServer and requires ScriptServer to be set up, please see [here](https://github.com/garrettjoecox/scriptserver/tree/master) for more information.

## `useEvent(javaServer: JavaServer)`

```ts
import { ScriptServer, JavaServer } from '@scriptserver/core';
import { useEvent } from '@scriptserver/event';

const javaServer = new JavaServer();
useEvent(javaServer);
// Or
const scriptServer = new ScriptServer();
useEvent(scriptServer.javaServer);
```

## Class: JavaServer

This module does not export JavaServer, but extends it

### `javaServer.on('chat', (event: { player: string; message: string; }) => void)`

### `javaServer.on('login', (event: { player: string; ip: string; }) => void)`

### `javaServer.on('logout', (event: { player: string; reason: string; }) => void)`

### `javaServer.on('achievement', (event: { player: string; achievement: string; }) => void)`

## Interface: `Config`

These configuration options are here to override as needed for flavors, if you are having trouble getting the events to emit in your given flavor of server, try overriding these.

- config: [Config](#interface-config)
  - event
    - flavorSpecific
      - [flavor name]
        - parseChatEvent: `(message: string) => { player: string; message: string; }`
        - parseLoginEvent: `(message: string) => { player: string; ip: string; }`
        - parseLogoutEvent: `(message: string) => { player: string; reason: string; }`
        - parseAchievementEvent: `(message: string) => { player: string; achievement: string; }`
