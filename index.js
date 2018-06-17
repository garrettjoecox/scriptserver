
const EventsEmitter = require('events');
const { spawn } = require('child_process');
const defaultsDeep = require('lodash.defaultsdeep');
const get = require('lodash.get');
const Rcon = require('./Rcon');

const defaultConfig = {
  flavor: 'vanilla',
  core: {
    jar: 'minecraft_server.jar',
    args: ['-Xmx2G'],
    pipeIO: true,
    spawnOpts: {
      stdio: ['pipe', 'pipe', 'inherit'],
    },
    rcon: {
      host: 'localhost',
      port: '25575',
      password: '0000',
      buffer: 50,
    },
    flavorSpecific: {
      default: {
        rconRunning: /^\[[\d:]{8}\] \[RCON Listener #1\/INFO\]: RCON running/i,
      },
      spigot: {
        rconRunning: /^\[[\d:]{8} INFO\]: RCON running/i,
      },
      sponge: {
        rconRunning: /^\[[\d:]{8} INFO\]: RCON running/i,
      },
      glowstone: {
        rconRunning: /^[\d:]{8} \[INFO\] Successfully bound rcon/i,
      },
    },
  },
};

class ScriptServer extends EventsEmitter {
  constructor(config = {}) {
    super();
    this.config = defaultsDeep({}, config, defaultConfig);
    this.modules = [];

    // RCON
    this.rcon = new Rcon(this.config.core.rcon);
    this.on('console', (l) => {
      if (this.rcon.state !== 'connected') {
        const rconRunning = get(this.config.core, `flavorSpecific.${this.config.flavor}.rconRunning`, this.config.core.flavorSpecific.default.rconRunning);
        if (l.match(rconRunning)) this.rcon.connect();
      }
    });

    process.on('exit', () => this.stop());
    process.on('close', () => this.stop());
  }

  start() {
    if (this.spawn) throw new Error('Server already started');

    const args = this.config.core.args.concat('-jar', this.config.core.jar, 'nogui');
    this.spawn = spawn('java', args, this.config.core.spawnOpts);

    if (this.config.core.pipeIO) {
      this.spawn.stdout.pipe(process.stdout);
      process.stdin.pipe(this.spawn.stdin);
    }

    this.spawn.stdout.on('data', (d) => {
      // Emit console
      d.toString().split('\n').forEach((l) => {
        if (l) this.emit('console', l.trim());
      });
    });

    return this;
  }

  stop() {
    if (this.spawn) {
      this.rcon.disconnect();

      this.spawn.kill();
      this.spawn = null;
    }

    return this;
  }

  use(module) {
    if (typeof module !== 'function') throw new Error('A module must be a function');

    if (this.modules.filter(m => m === module).length === 0) {
      this.modules.push(module);
      module.call(this);
    }

    return this;
  }

  send(command) {
    return new Promise((resolve) => {
      this.rcon.exec(command, result => resolve(result));
    });
  }

  sendConsole(command) {
    return new Promise((resolve) => {
      this.spawn.stdin.write(`${command}\n`, () => resolve());
    });
  }
}

module.exports = ScriptServer;
