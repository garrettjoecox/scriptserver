'use strict';

const EventsEmitter = require('events');
const spawn = require('child_process').spawn;

class ScriptServer extends EventsEmitter {

  constructor(jar, args) {
    super();

    this.config = {};
    this.modules = [];
    args.push('-jar', jar, 'nogui');
    this.spawn = spawn('java', args);

    process.stdin.on('data', d => this.spawn.stdin.write(d));
    this.spawn.stdout.on('data', d => this.emit('console', d.toString()));

    this.spawn.on('exit', process.exit);
    process.on('exit', this.spawn.kill);
    process.on('close', this.spawn.kill);
  }

  use(module) {
    if (this.modules.filter(m => m === module).length === 0) {
      this.modules.push(module);
      module.call(this);
    }
  }

  send(command, successRegex, failRegex) {
    return new Promise((resolve, reject) => {
      this.spawn.stdin.write(command + '\n');

      if (!successRegex) resolve();
      else {
        const temp = function(event) {
          const success = event.match(successRegex);
          if (success) {
            resolve(success);
            this.removeListener('console', temp);
          } else if (failRegex) {
            const fail = event.match(failRegex);
            if (fail) {
              reject(fail);
              this.removeListener('console', temp);
            }
          }
        }
        this.on('console', temp);
        setTimeout(() => {
          reject(new Error('Timed out'));
          this.removeListener('console', temp);
        }, 2000);
      }

    });
  }

}

module.exports = ScriptServer;