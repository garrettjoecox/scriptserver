# scriptserver

[![](http://i.imgur.com/zhptNme.png)](https://github.com/garrettjoecox/scriptserver/tree/master)

![Total Downloads](https://img.shields.io/npm/dt/scriptserver.svg)

## What's ScriptServer?

A configurable Minecraft server wrapper written in Node.js.
Using a combination of RCON and the output of the server console it allows you to do some pretty cool things, like making simple server-side plugins on a vanilla minecraft server jar.

## What version of Minecraft does it work with?

Technically, it can work with any version of Minecraft that logs to STDOUT and has an RCON port exposed (Which dates back to ~2012 in Vanilla). Where problems usually arise from version to version is logging format changes, but it mostly just requires fiddling with the RegExp set up in the indiviual plugins.

## Get started

**Prerequisites**

- NodeJS
- Somewhat of a familiarity with Javascript/Typescript
- Minecraft server jar ([Vanilla](https://www.minecraft.net/en-us/download/server) / Spigot / Etc)

**Setup**

- Create a folder for your server and drop in the downloaded server.jar
- Within the folder run `npm init` with the default options and then `npm i @scriptserver/core @scriptserver/essentials`
- Create a file named `server.js` with the following content

```js
const { ScriptServer } = require('@scriptserver/core');
const { useEssentials } = require('@scriptserver/essentials');

const server = new ScriptServer({
  javaServer: {
    path: '.',
    jar: 'server.jar',
    args: ['-Xmx1024M', '-Xms1024M'],
  },
  rconConnection: {
    port: 25575,
    password: 'password',
  },
});

useEssentials(server);

server.start();
```

- Start your server with

```bash
node server.js
```

- Close the node process, agree to the `eula.txt` and within `server.properties` make the following changes (they need to match whatever is specified in the config above):

```yml
enable-rcon=true
rcon.port=25575
rcon.password=password
broadcast-rcon-to-ops=false
```

- Start your server again with

```bash
node server.js
```

- Fin! You should now be set up with the essentials plugin

## Plugins (& Docs)

**Official**

- [Core](https://github.com/garrettjoecox/scriptserver/tree/master/packages/core) - ScriptServer, JavaServer & RconConnection APIs
- [Event](https://github.com/garrettjoecox/scriptserver/tree/master/packages/event) - Parses events like login/logout/chat/achievement
- [Util](https://github.com/garrettjoecox/scriptserver/tree/master/packages/util) - Helper methods usually involvivng commands within Minecraft like /tellraw
- [Command](https://github.com/garrettjoecox/scriptserver/tree/master/packages/command) - Module for registering custom commands that can be activated with chat messages (e.g. `~home`)
- [Json](https://github.com/garrettjoecox/scriptserver/tree/master/packages/json) - Simple module for storing and reading data in JSON files
- [Essentials](https://github.com/garrettjoecox/scriptserver/tree/master/packages/essentials) - Combines all of the plugins above to provide things like warps, homes, kits, MOTD, etc.

**Community**

Submit a ticket to get yours added!

## Contributing

- Clone this repo
- Globally install lerna with `npm i -g lerna`
- Run `lerna bootstrap` to link all packages
- Run `lerna run build` to build all packages
- Profit?
