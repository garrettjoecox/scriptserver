
var path = require('path');
var pfy = require('pfy');
var request = require('request');
var fs = require('fs');

/*** The engine of ScriptServer ***/

function ScriptServer(jar, args) {
    var self = this;

    self.modules = {};
    self.parseLoop = {};
    self.jar = jar;
    self.args = args;

    process.stdin.on('data', d => {
        if (self.spawn) self.spawn.stdin.write(d);
        else {
            var s = d.toString();
            s = s.slice(0, s.length -1).split(' ');
            if (s[0] === 'start') {
                if (s[1] === 'release' || s[1] === 'snapshot') self.jar = s[1];
                self.start();
            }
        }
    });
    process.on('exit', () => {
        if (self.spawn) self.spawn.kill();
    });
}

/*** Core Methods ***/

ScriptServer.prototype.start = function() {
    var self = this;

    if (self.spawn) return Promise.reject('Server already started.');

    return Promise.resolve()
        .then(() => (self.jar === 'snapshot' || self.jar === 'release') ? update(self.jar) : self.jar)
        .then(jar => {
            var args = self.args.slice(0);

            args.push('-jar', jar, 'nogui');
            self.spawn = require('child_process').spawn('java', args);

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

            self.spawn.on('exit', () => {
                self.spawn = null;
            });

            return self;
        });
};

ScriptServer.prototype.stop = function() {
    var self = this;

    if (!self.spawn) return Promise.reject('No server running');

    self.spawn.kill();
    self.spawn = null;

    return Promise.resolve(self);
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
        } else resolve();
    });
};

function update(jar) {
    var url = 'http://s3.amazonaws.com/Minecraft.Download/versions/';
    var newVersion, newJar, newPath, dir = process.cwd();

    return pfy(request)(url + 'versions.json')
        .then(response => {
            newVersion = JSON.parse(response.body).latest[jar];
            newJar = `minecraft_server.${newVersion}.jar`;
            newPath = path.join(dir, newJar);
            return pfy(fs.stat)(newPath)
                .then(() => true)
                .catch(() => false);
        })
        .then(exists => {
            if (exists) return newJar;
            else return downloadFile(`${url}${newVersion}/${newJar}`, newPath);
        })
        .then(() => newJar);
}

function downloadFile(url, filePath) {
    return new Promise((resolve, reject) => {
        request
            .get(url)
            .on('error', err => reject(err))
            .pipe(fs.createWriteStream(filePath))
            .on('error', err => reject(err))
            .on('close', () => resolve());
    });
}

module.exports = ScriptServer;
