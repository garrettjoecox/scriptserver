# scriptserver

[![](http://i.imgur.com/zhptNme.png)](https://github.com/garrettjoecox/scriptserver/tree/next)

#### FYI: This package is an addon for ScriptServer and requires ScriptServer to be set up, please see [here](https://github.com/garrettjoecox/scriptserver/tree/next) for more information.

## `useCommand(javaServer: JavaServer)`

```ts
import { ScriptServer, JavaServer } from '@scriptserver/core';
import { useCommand } from '@scriptserver/command';

const javaServer = new JavaServer({
  command: {
    prefix: '!',
  },
});
useCommand(javaServer);

// Or

const scriptServer = new ScriptServer({
  command: {
    prefix: '!',
  },
});
useCommand(scriptServer.javaServer);
```

## Class: JavaServer

This module does not export JavaServer, but extends it

### `javaServer.command(cmd: string, callback: (event: CommandEvent) => void)`

```ts
javaServer.command('head', ({ player, args }) => {
  javaServer.send(`give ${player} minecraft:skull 1 3 {SkullOwner:"${args[0]}"}`);
});
```

### `javaServer.on('command', (event: CommandEvent) => void)`

This is exposed for advanced uses, not necssary to use this if using the `javaServer.command` method.

## Interface: `Config`

- config: [Config](#interface-config)
  - command
    - prefix: `string` - Prefix in chat to trigger command (default: `~`)
