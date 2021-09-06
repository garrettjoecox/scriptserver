import EventsEmitter from 'events';
import { JavaServer } from './JavaServer';
import { RconConnection } from './RconConnection';
import { Config, DeepPartial } from './Config';

export class ScriptServer extends EventsEmitter {
  public config: Config;
  public javaServer: JavaServer;
  public rconConnection: RconConnection;

  constructor(config: DeepPartial<Config> = {}) {
    super();

    this.config = config as Config;

    this.javaServer = new JavaServer(config);
    this.rconConnection = new RconConnection(config);

    this.rconConnection.on('connected', () => this.emit('started'));
  }

  public start() {
    this.javaServer.start();
    this.javaServer.once('started', () => {
      this.rconConnection.connect();
    });
  }

  public stop() {
    this.rconConnection.disconnect();
    this.javaServer.stop();
  }
}
