
const SimpleRcon = require('simple-rcon');

const states = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
};

class Rcon {
  constructor(config = {}) {
    this.config = config;
    this.state = states.DISCONNECTED;
    this.queue = [];

    this.rcon = new SimpleRcon({
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      timeout: 0,
    });

    this.rcon.on('authenticated', () => {
      this.state = states.CONNECTED;
    });
    this.rcon.on('disconnected', () => {
      this.state = states.DISCONNECTED;
    });

    this.tick();
  }

  connect() {
    this.rcon.connect();
  }

  disconnect() {
    this.rcon.close();
  }

  tick() {
    if (this.state === states.CONNECTED && this.queue.length > 0) {
      const item = this.queue.shift();
      this.rcon.exec(item.command, ({ body }) => item.callback(body));
    }

    setTimeout(() => this.tick(), this.config.buffer);
  }

  exec(command, callback) {
    this.queue.push({
      command,
      callback,
    });
  }
}

module.exports = Rcon;
