
/*** The engine of ScriptServer ***/

function ScriptServer(args) {
    var self = this;
    self.modules = {};
    self.parseLoop = {};

    args = args.split(' ');
    if (args[0] === 'java') args.shift();
    self.args = args;
}

/*** Core Methods ***/

ScriptServer.prototype.start = function() {
    var self = this;

    self.spawn = require('child_process').spawn('java', self.args);

    self.spawn.stdout.on('data', d => {
        var line = d.toString();
        process.stdout.write(d);
        for (var id in self.parseLoop) {
            var obj = self.parseLoop[id];
            if (obj.condition !== undefined && !obj.condition()) continue;
            if (obj.regexp) obj.method(line.match(obj.regexp));
            else obj.method(line);
        }
    });
    self.spawn.stderr.on('data', d => process.stderr.write(d));
    process.stdin.on('data', d => self.spawn.stdin.write(d));
    process.on('exit', () => self.spawn.kill());

    return self;
};

ScriptServer.prototype.stop = function() {
    var self = this;

    self.spawn.kill();
};

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
