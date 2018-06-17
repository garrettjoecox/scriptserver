
const EventsEmitter = require('events');
const { spawn } = require('child_process');
const defaultsDeep = require('lodash.defaultsdeep');
const Rcon = require('./Rcon');

const defaultConfig = {
  core: {
    jar: 'minecraft_server.jar',
    args: ['-Xmx2G'],
    pipeIO: false,
    spawnOpts: {
      stdio: ['pipe', 'pipe', 'inherit'],
    },
    rcon: {
      host: 'localhost',
      port: '25575',
      password: '0000',
      buffer: 25,
    },
    api: 'spigot',
    regex: {
      vanilla: {
        rcon_listening: /\[RCON Listener #1\/INFO\]: RCON running/i
      },
      spigot: {
        rcon_listening: /\ INFO]: RCON running on/i,
        server_stopped: /\ INFO]: Stopping server/i
      },
      bukkit: {
        rcon_listening: /\ INFO]: RCON running on/i
      }
    }
  }
};

class ScriptServer extends EventsEmitter {
  constructor(config = {}) {
    super();
    this.config = defaultsDeep({}, config, defaultConfig);
    this.api = this.config.core.api;
    this.modules = [];

    // RCON
    this.rcon = new Rcon(this.config.core.rcon);
    this.on('console', (l) => {
      if (l.match(this.config.core.regex[this.api].rcon_listening)) this.rcon.connect();
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
        if (l) this.emit('console', l);
      });
    });

    return this;
  }

  stop() {
    if (this.spawn) {
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
}

module.exports = ScriptServer;
