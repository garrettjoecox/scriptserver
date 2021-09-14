# @scriptserver/essentials

[![](http://i.imgur.com/zhptNme.png)](https://github.com/garrettjoecox/scriptserver/tree/next)

#### FYI: This package is an addon for ScriptServer and requires ScriptServer to be set up, please see [here](https://github.com/garrettjoecox/scriptserver/tree/next) for more information.

## `useEssentials(scriptServer: ScriptServer)`

```ts
import { ScriptServer, ScriptServer } from '@scriptserver/core';
import { useEssentials } from '@scriptserver/essentials';

const scriptServer = new ScriptServer({
  essentials: {
    warp: {
      opOnly: true,
    },
  },
});

useEssentials(scriptServer);
```

## Commands

- `~sethome [name]`
  Set a home (optionally with a name, if multiple homes are enabled) in your current dimension

- `~delhome [name]`
  Remove a home (optionally with a name, if multiple homes are enabled) in your current dimension (Useful for limited amount of homes)

- `~home [name]`
  Teleport to a home (optionally with a name, if multiple homes are enabled) in your current dimension

- `~setspawn`
  Set the spawn in your current dimension (requires OP)

- `~spawn`
  Teleport to spawn in your current dimension

- `~setwarp <name>`
  Set a warp point specified by `name` in current dimension (Optionally requires OP)

- `~delwarp <name>`
  Remove the specified warp in current dimension (Optionally requires OP)

- `~warp <name>`
  Teleport to warp's location

- `~tpa <username>`
  Sends a teleport request to the specified user

- `~tpahere <username>`
  Sends a teleport here request to the specifed user

- `~tpaccept`
  Accept your current teleport request.

- `~tpdeny`
  Deny your current teleport request.

- `~back`
  Teleport back to a previous location (Remembers location from `spawn`, `tpa`, `warp`, and `home`)

- `~day`
  Start a vote for setting the time to day.

- `~night`
  Start a vote for setting the time to night.

- `~weather`
  Start a vote for toggling downfall.

## Interface: `Config`

These configuration options are here to override as needed for flavors, if you are having trouble getting the events to emit in your given flavor of server, try overriding these.

- config: [Config](#interface-config)
  - essentials
    - motd
      - enabled: `boolean` (Default: `true`)
      - firstTime: `string` (Default: `Welcome to the server, ${player}!`)
      - text: `string` (Default: `Welcome back ${player}!`)
    - starterKit
      - enabled: `boolean` (Default: `true`)
      - items: `string[]` (Default: `['iron_pickaxe', 'iron_shovel', 'iron_axe', 'iron_sword', 'red_bed', 'bread 32']`)
    - home
      - enabled: `boolean` (Default: `true`)
      - amount: `number` (Default: `3`)
    - spawn: `boolean` (Default: `true`)
    - warp
      - enabled: `boolean` (Default: `true`)
      - opOnly: `boolean` (Default: `true`)
    - tpa: `boolean` (Default: `true`)
    - back: `boolean` (Default: `true`)
    - day
      - enabled: `boolean` (Default: `true`)
      - percent: `number` (Default: `50`)
    - night
      - enabled: `boolean` (Default: `true`)
      - percent: `number` (Default: `50`)
    - weather
      - enabled: `boolean` (Default: `true`)
      - percent: `number` (Default: `50`)
