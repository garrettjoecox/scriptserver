scriptserver
============

[![](http://i.imgur.com/zhptNme.png)](https://github.com/garrettjoecox/scriptserver)

[![Gitter chat](https://img.shields.io/gitter/room/ScriptServer/Lobby.svg)](https://gitter.im/ScriptServer/Lobby) ![Total Downloads](https://img.shields.io/npm/dt/scriptserver.svg)

## What's ScriptServer?
A configurable Minecraft server wrapper written in Node.js.
Using a combination of RCON and the output of the server console it allows you to do some pretty cool things.
Though, this is the engine of ScriptServer, and is honestly pretty bare.
The modules are where the magic happens (check 'Published Modules' down below).

The ScriptServer engine does 3 things:
 - Starts the Minecraft server as a child process, using the specified jar & arguments
 - Provides an interface to send commands, use their results, and make use of other things that are displayed in the server console.
 - Initializes a simple module loader for ScriptServer modules.

## What version of Minecraft does it work with?

Because it relies on the RCON interface and the format of the output log, it should work with pretty much any version of Minecraft dating back to 2012. It should continue to work for all future releases and snapshots as long as the logging format doesn't drastically change, and they don't drop RCON support. (Both unlikely)

## Getting Started

#### Prerequisites
- [NodeJS](https://nodejs.org/en/) (^8.0.0 recommended)
- Somewhat of a familiarity with NodeJS is recommended.

#### Setup
While inside the root of your Minecraft server directory, run `npm install scriptserver`. Then create a javascript file to run the server, I usually go with `server.js`. Paste in the following:

```javascript
const ScriptServer = require('scriptserver');

const server = new ScriptServer({
  core: {
    jar: 'minecraft_server.jar',
    args: ['-Xmx2G'],
    rcon: {
      port: '25575',
      password: 'password'
    }
  }
});

server.start();
```

When initializing your ScriptServer instance all it takes is an optional config object, which is automatically set to `server.config`, and accessible by third party modules. Read each module's README to check for configuration options.

The options in the `core` config are used by the ScriptServer engine to determine the startup jar, arguments, and RCON configuration.

**RCON IS NOT ENABLED BY DEFAULT**, you will need to add the following to your `server.properties` to enable it:
```
enable-rcon=true
rcon.port=25575
rcon.password=password
```

You start your server with `server.start()`

Finally, you can run the server with node using
```bash
node server.js
```

And that's it!

Seriously. Like I said the engine is pretty bare, especially to users, but in the section 'Creating Modules' I'll explain how developers can utilize the simplicity of this engine.

For people looking to quickly try this out, I recommend giving [scriptserver-essentials](https://github.com/garrettjoecox/scriptserver-essentials) a try, it provides basic commands like `tpa`, `home`, and `spawn`, as well as a starter kit.

## Using Modules

To put 3rd party modules to use, you must first of course `npm install` them, then in your `server.js` initialize them one at a time with `server.use()`

```javascript
const ScriptServer = require('scriptserver');

// Configuration

const server = new ScriptServer({
  core: {
    jar: 'minecraft_server.jar',
    args: ['-Xmx2G']
  },
  command: {
    prefix: '~'
  },
  essentials: {
    starterKit: {
      enabled: false
    }
  }
});

// Loading modules

server.use(require('scriptserver-command'))
// or
const ssEssentials = require('scriptserver-essentials');
server.use(ssEssentials);

// Start server

server.start();
```

As for the functionality of the actual module please refer to it's own `README.md` for use.

## Creating Modules

As a developer you have a few tools to work with. Below I will explain and use them in examples.

### 1) server.on(event, callback)

The server's console output is our main way of getting data from the server to our javascript wrapper.
Every time a log is output the engine emits the `console` event. This sounds useless as first but combining that with RegExp you'd be surprised at how much you can do.

Because ScriptServer extends the EventsEmitter, 3rd party module creators can utilize the emitter themselves. For instance the `scriptserver-event` module emits the events `chat`, `login`, `logout`, etc. right along side the main `console` event.

#### Simple ~head command example
```javascript
server.on('console', line => {
    // Regex matches when a user types ~head in chat
    const result = line.match(/]: <([\w]+)> ~head (.*)/);
    if (result) {
        // Player that sent command
        console.log(result[1])
        // head user is requesting
        console.log(result[2]);
        // Give the user the player head!
        server.send(`give ${result[1]} minecraft:skull 1 3 {SkullOwner:"${result[2]}"}`)
    }
});
```

### 2) server.send(command)

The send method allows you to send commands to the Minecraft server.
See [here](http://minecraft.gamepedia.com/Commands) for a list of available commands. When mixed with ES2015's template strings and Promises, server.send can be a powerful tool.

#### Using server.send
```javascript
const player = 'ProxySaw';
// Just like commands you'd type in the server console.
server.send(`give ${player} minecraft:diamond 1`);
server.send(`playsound entity.item.pickup master ${player} ~ ~ ~ 10 1 1`);
server.send(`say ${player} got a diamond!`);
```

`server.send` also allows you to use the result of the command through it's returned promise. Similar to the console output, when combined with RegExp this can be extremely useful.

#### Using server.send promises to get player location

Sending the following command to the server console:
```
execute ProxySaw ~ ~ ~ /testforblock ~ ~ ~ minecraft:air 10
```
Will result in the following line being output:
```
[10:32:37] [Server thread/INFO]: The block at 20,74,-161 had the data value of 0 (expected: 10).
```

Using the RegExp: `/at\s([-\d]+),([-\d]+),([-\d]+)/` I can pull the coordinates out of that log and use them within my javascript function.

```javascript
var player = 'ProxySaw';

server.send(`execute ${player} ~ ~ ~ /testforblock ~ ~ ~ minecraft:air 10`)
  .then(result => {
    const coords = result.match(/at\s([-\d]+),([-\d]+),([-\d]+)/);
    console.log('X:', coords[0]);
    console.log('Y:', coords[1]);
    console.log('Z:', coords[2]);
  });
```

### 3) server.sendConsole(command)

sendConsole is a helper method for special use-cases that want/need to bypass the RCON interface, and instead write directly to the server console. The drawback of this, is that there is no direct response to anything sent directly to the console. About 99% of the time you'll likely want to use `server.send` instead.

### Module Structure
So now that you know how to utilize those tools, it's time to build a module. Whenever a user `.use`'s your module, it simply invokes it with the context of their server, therefor encapsulate all server-side logic in a module.exports function.

The following was taken from the [scriptserver-command module](https://github.com/garrettjoecox/scriptserver-command). It allows for custom commands to be created using server.command() Read inline comments for breakdown.
```javascript
// The function that is called on server.use(require('scriptserver-command'))
module.exports = function() {
  // Invoked with the context of the user's server
  const server = this;
  // Local storage for commands
  const commands = {};

  // Uses another scriptserver module
  server.use(require('scriptserver-event'));

  // Interface for users to add commands
  server.command = function(cmd, callback) {
    commands[cmd] = commands[cmd] || [];
    commands[cmd].push(callback);
  }

  // Hooks into chat event to watch for the ~ char, then emits the command event
  server.on('chat', event => {
    const stripped = event.message.match(/~([\w]+)\s?(.*)/);
    if (stripped && commands.hasOwnProperty(stripped[1])) {
      server.emit('command', {
        player: event.player,
        command: stripped[1],
        args: stripped[2].split(' '),
        timestamp: Date.now()
      });
    }
  });

  // Invokes any listeners on the command the player triggered
  server.on('command', event => {
    if (commands.hasOwnProperty(event.command)) {
      commands[event.command].forEach(callback => callback(event));
    }
  });
}
```

Now for using the scriptserver-command module,
```javascript
const ScriptServer = require('scriptserver');
const server = new ScriptServer({
  core: {
    jar: 'minecraft_server.jar',
    args: ['-Xmx2G']
  },
});

server.use(require('scriptserver-command'));

server.command('head', event => {
  var skull = event.args[0] || event.player
  server.send(`give ${event.player} minecraft:skull 1 3 {SkullOwner:"${skull}"}`);
});

server.start();
```

And muahlah! In game sending the command `~head` will give yourself your player head or passing in a name `~head Notch` will give you their player head!

If you run into any issues or questions, read through other published modules(below) or submit an issue and I'll try to help you out!

## Published Modules
- [scriptserver-essentials](https://github.com/garrettjoecox/scriptserver-essentials)
Some essential server commands like home, tpa, and head.
- [scriptserver-command](https://github.com/garrettjoecox/scriptserver-command)
Provides interface for adding custom server commands.
- [scriptserver-event](https://github.com/garrettjoecox/scriptserver-event)
Interface for hooking onto events like chat, login, and logout.
- [scriptserver-util](https://github.com/garrettjoecox/scriptserver-util)
Multiple helper commands for module developers.
- [scriptserver-json](https://github.com/garrettjoecox/scriptserver-json)
Provides ability to read/write from JSON files.
- [scriptserver-update](https://github.com/garrettjoecox/scriptserver-update)
Lets you restart the server in game, and auto update to snapshot/release channels.
