'use strict';

const EventsEmitter = require('events');
const spawn = require('child_process').spawn;

class ScriptServer extends EventsEmitter {

  constructor(config = {}) {
    super();

    this.config = config;
    this.modules = [];
  }

  start(jar, args) {
    args.push('-jar', jar, 'nogui');
    let tmp = this.config.serverprocess || {};
    console.log(tmp);
    this.spawn = spawn('java', args, tmp);

    process.stdin.on('data', d => this.spawn.stdin.write(d));
    this.spawn.stdout.on('data', d => this.emit('console', d.toString()));

    process.on('exit', () => this.stop());
    process.on('close', () => this.stop());
  }

  stop() {
    if (this.spawn) {
      this.spawn.kill();
      this.spawn = null;
    }
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
