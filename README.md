scriptserver
============

[![](http://i.imgur.com/zhptNme.png)](https://github.com/garrettjoecox/scriptserver)

## What's ScriptServer?
A Minecraft server wrapper written in Node.js.
Using the i/o of the server console it allows you to do some pretty cool things.
Though, this is the engine of ScriptServer, and is honestly pretty bare.
The modules are where the magic happens (check 'Published Modules' down below).

The ScriptServer engine does 3 things:
 - Starts the minecraft server as a child process, using the specified jar & args
 - Provides the interface to the I/O of the server
 - Initializes a simple module loader for ScriptServer modules.

## What version of Minecraft does it work with?

I haven't yet tested how far back it can go, but because it's solely based on the output logs it works with pretty much any recent/future versions, including snapshots. (As long as the logging format doesn't drastically change)

## Getting Started

#### Prerequisites
- [NodeJS](https://nodejs.org/en/) (v6.7.0 recommended)
- Somewhat of a familiarity with NodeJS is recommended.

#### Setup
While inside the root of your Minecraft server directory, run `npm install scriptserver`. Then create a javascript file to run the server, I usually go with `server.js`. Paste in the following:

```javascript
const ScriptServer = require('scriptserver');

const server = new ScriptServer('snapshot.minecraft_server.jar', ['-Xmx2048M']);
```

The first param will be a specific jar in your local directory, and the second is a list of java arguments to apply to the server.

Then run the server with node using
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
const server = new ScriptServer('snapshot.minecraft_server.jar', ['-Xmx2048M']);

// Loading modules
server.use(require('scriptserver-command'))
// or
const ssEssentials = require('scriptserver-essentials');
server.use(ssEssentials);
```

As for the functionality of the actual module please refer to it's own `README.md` for use.

## Creating Modules

As a developer you have two main tools to work with. Below I will explain and use them in examples.

### 1) server.on(event, callback)

The server's console output is our main way of getting data from the server to our javascript wrapper.
Every time a log is output the engine emits the `console` event. This sounds useless as first but combining that with RegExp you'd be surprised at how much you can do.

Because ScriptServer extends the EventsEmitter, 3rd party module creators can utilize the emitter themselves. For instance the `scriptserver-event` module emits the events `chat`, `login`, `logout`, etc. right along side the main `console` event.

#### Simple command example
```javascript
server.on('console', line => {
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

### 2) server.send

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

`server.send` also allows you to pass in a regexp as the second argument, that will parse the next line output from console and hand it off as a promise to the next function, example below (This interface is a WIP, and is buggy if there is a ton of logs)

#### Using server.send promises to get player location

Sending the following command to the server console:
```
execute ProxySaw ~ ~ ~ /testforblock ~ ~ ~ minecraft:air 10
```
Will result in the following line being output:
```
[10:32:37] [Server thread/INFO]: The block at 20,74,-161 had the data value of 0 (expected: 10).
```

Using the RegExp: `/at\s([-\d]+),([-\d]+),([-\d]+)/` I can pull the coordinates out of that log and hand them off to the next promise function.

```javascript
var player = 'ProxySaw';

server.send(`execute ${player} ~ ~ ~ /testforblock ~ ~ ~ minecraft:air 10`, /at\s([-\d]+),([-\d]+),([-\d]+)/)
  .then(ouputCoords => {
    console.log('X:', ouputCoords[0]);
    console.log('Y:', ouputCoords[1]);
    console.log('Z:', ouputCoords[2]);
  });
```

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
const server = new ScriptServer('snapshot.minecraft_server.jar', ['-Xmx2048M']);

server.use(require('scriptserver-command'));

server.command('head', event => {
  var player = event.args[0] || event.player
  server.send(`give ${event.player} minecraft:skull 1 3 {SkullOwner:"${player}"}`);
});
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
