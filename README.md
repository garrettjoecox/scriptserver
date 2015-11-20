scriptserver
============

[![](http://i.imgur.com/zhptNme.png)](https://github.com/garrettjoecox/scriptserver)

## What's ScriptServer?
A Minecraft server wrapper written in Node.js.
Using the i/o of the server console it allows you to do some pretty cool things.
Though, this is the engine of ScriptServer, and is honestly pretty bare.
The modules are where the magic happens (check 'Published Modules' down below).

The ScriptServer engine does 4 things:
 - Provides the methods to start and stop the Minecraft server, piping the i/o
 - Sets up a parseLoop object in which each line of output will go through.
 - Initializes the module loader. (`ScriptServer.use`)
 - Configures the input command to send messages to the server. (`ScriptServer.send`)

## What version of Minecraft does it work with?

I haven't yet tested how far back it can go, but because it's solely based on the output logs it works with pretty much any recent/future versions, including snapshots. (As long as the logging format doesn't drastically change)

## Getting Started

While inside the root of your Minecraft server directory, run `npm install scriptserver`, and create a javascript file to run the server, I usually go with `server.js`.

```javascript
var ScriptServer = require('scriptserver');

// More customization on startup command coming soon...
var server = new ScriptServer('-Xmx2048M -jar minecraft_server.15w45a.jar nogui');

server.start();
```

And that's it!

Seriously. Like I said the engine is pretty bare, especially to users, but in the section 'Creating Modules' I'll explain how developers can utilize the simplicity of this engine.

## Using Modules

To put 3rd party modules to use, you must first of course `npm install` them, then in your `server.js` inject them either one at a time or all together as an array with `server.use()`

```javascript
var ScriptServer = require('scriptserver');
var server = new ScriptServer('-Xmx2048M -jar minecraft_server.15w45a.jar nogui');

// Module Loader
server.use([
    'scriptserver-basics',
    'scriptserver-command',
    'scriptserver-json'
]);
```

As for the functionality of the actual module please refer to it's own `README.md` for use.

## Creating Modules

As a developer you have three main tools to work with. Below I will explain and use them in examples.

### 1) server.parseLoop

The server's console output is our main way of getting data from the server to our javascript wrapper.
Every time a log is output the engine sends the log to every child of the parseLoop object.

#### How to create a parseLoop child
```javascript
server.parseLoop.parseMethodId = {

    // Same as above ^ just a unique identifier
    id: 'parseMethodId',

    // Optional, a function that is run each time to
    // decide whether or not the child's method is run.
    condition: function() { return someCondition; },

    // Optional, a regular expression that is run on
    // the log, the output is given to the child's method.
    regexp: /\]:\s<([\w]+)>\s(.*)/,

    // Function to be run on the log/regex output
    method: function(output) {
        server.doStuffWith(output);
    }
};
```

### 2) server.send

The send method allows you to send commands to the Minecraft server.
See [here](http://minecraft.gamepedia.com/Commands) for a list of available commands. When mixed with ES2015's template strings and Promises, server.send can be a powerful tool.

#### Using server.send
```javascript
var player = 'ProxySaw';
// Just like commands you'd type in the server console.
server.send(`give ${player} minecraft:diamond 1`);
server.send(`playsound entity.item.pickup ${player} ~ ~ ~ 10 1 1`);
server.send(`say ${player} got a diamond!`);
```

Server.send also allows you to pass in a regexp as the second argument, that will parse the next line output from console and hand it off as a promise to the next function, example below (This interface is a WIP, and is buggy if there is a ton of logs)

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

### 3) ScriptServer.prototype

ScriptServer.prototype is basically where you'll stick all of your helper commands. You can read up on prototypes [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/prototype) but basically any method you attach to ScriptServer's prototype you will be able to access from your server variable. IE:
```javascript
var ScriptServer = require('scriptserver');
var server = new ScriptServer('-Xmx2048M -jar minecraft_server.15w45a.jar nogui');

ScriptServer.prototype.getLocation = function(player) {

  // Inside the ScriptServer prototypes 'this' refers to the server.
  console.log(this === server);

  return someLogicHere;
}

server.getLocation('ProxySaw')
  .then(location => {
    console.log('ProxySaw is at', location);
  });
```

### Module Structure
So now that you know how to utilize those tools, it's time to build a module. Whenever a user `.use`'s your module, it simply calls require on it and hands it the server, therefor encapsulate all server-side logic in a module.exports function (the prototypes can be outside).

The following was taken from the [scriptserver-command module](https://github.com/garrettjoecox/scriptserver-command). It allows for custom commands to be created using server.command() Read inline comments for breakdown.
```javascript
// Pulling in ScriptServer for attaching to prototype
var ScriptServer = require('scriptserver');

// The function that is called on server.use('scriptserver-command')
module.exports = function(server) {

    // Initializes commands object.
    server.commands = server.commands || {};

    // Initializes the parseLoop child 'parseCommand'.
    server.parseLoop.parseCommand = {
        id: 'parseCommand',

        // Parses out the username, command and arguments of the output
        regexp: /<([\w]+)>\s~([\w]+)\s?(.*)/,

        // Using the stripped output of the RegExp, checks if the given command
        // exists in the commands storage, then calls the method using the ouput
        method: function(stripped) {
            if (stripped && server.commands[stripped[2]]) {
                server.commands[stripped[2]]({
                    sender: stripped[1],
                    command: stripped[2],
                    args: stripped[3].split(' '),
                    timestamp: Date.now()
                });
            }
        }
    };
};

// Attaches the .command method to the ScriptServer prototype
ScriptServer.prototype.command = function(name, callback) {

    // Pairs the given callback to the command name in the command storage
    this.commands[name] = callback;
    return this;
};
```

Now for using the scriptserver-command module,
```javascript
var ScriptServer = require('scriptserver');
var server = new ScriptServer('-Xmx2048M -jar minecraft_server.15w45a.jar nogui');

server.use('scriptserver-command');

server.command('head', cmd => {
  var player = cmd.args[0] || cmd.sender
  server.send(`give ${cmd.sender} minecraft:skull 1 3 {SkullOwner:"${player}"}`);
});
```

And muahlah! In game sending the command `~head` will give yourself your player head or passing in a name `~head Notch` will give you their player head!

If you run into any issues or questions, read through other published modules(below) or submit an issue and I'll try to help you out!

## Published Modules
- [scriptserver-basics](https://github.com/garrettjoecox/scriptserver-basics)
Some essential server commands like home, tpa, and head.
- [scriptserver-command](https://github.com/garrettjoecox/scriptserver-command)
Provides interface for adding custom server commands.
- [scriptserver-event](https://github.com/garrettjoecox/scriptserver-event)
Interface for hooking onto events like chat, login, and logout.
- [scriptserver-helpers](https://github.com/garrettjoecox/scriptserver-helpers)
Multiple helper commands for module developers.
- [scriptserver-json](https://github.com/garrettjoecox/scriptserver-json)
Provides ability to read/write from JSON files.
- [scriptserver-portal](https://github.com/garrettjoecox/scriptserver-portal)
Commands for creating portals with end_gateways
