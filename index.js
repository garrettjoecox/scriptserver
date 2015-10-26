
var spawn = require('child_process').spawn;

/*** The engine of ScriptServer ***/

function ScriptServer(args) {
    var self = this;
    self.modules = {};
    
    // Spawn minecraft server
    args = args.split(' ');
    if (args[0] === 'java') args.shift();
    self.spawn = spawn('java', args);
    
    // Initialize parse loop
    self.parseLoop = {};
    self.spawn.stdout.on('data', d => {
        process.stdout.write(d);
        var line = d.toString();
        for (var id in self.parseLoop) {
            var obj = self.parseLoop[id];
            if (obj.condition !== undefined && !obj.condition()) continue;
            if (obj.regexp) obj.method(obj.regexp.exec(line));
            else obj.method(line);
        }
    });
    process.stdin.on('data', d => self.spawn.stdin.write(d));
    process.on('exit', d => self.spawn.kill());
}

/*** Core Methods ***/

ScriptServer.prototype.use = function(packages) {
    var self = this;
    
    if (!Array.isArray(packages)) packages = packages.split(' ');
    packages.forEach(package => {
        if (!self.modules[package]) {
            self.modules[package] = true;
            require(package)(self);
        }
    });

    return self;
};

ScriptServer.prototype.send = function(command, responseRegex) {
    var self = this;
    
    return new Promise((resolve, reject) => {
        self.spawn.stdin.write(command + '\n');
        
        if (responseRegex) {
            var id = Date.now();
            self.parseLoop[id] = {
                id: id,
                regexp: responseRegex,
                method: function(response) {
                    resolve(response);
                    delete self.parseLoop[id];
                }
            };
        } else {
            resolve();
        }
    });
};

module.exports = ScriptServer;
