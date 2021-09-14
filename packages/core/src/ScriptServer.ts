import { JavaServer } from './JavaServer';
import { RconConnection } from './RconConnection';
import { Config, DeepPartial } from './Config';

export class ScriptServer {
  public config: Config;
  public javaServer: JavaServer;
  public rconConnection: RconConnection;

  constructor(config: DeepPartial<Config> = {}) {
    this.config = config as Config;

    this.javaServer = new JavaServer(config);
    this.rconConnection = new RconConnection(config);
  }

  public start() {
    this.javaServer.start();
    this.javaServer.once('start', () => {
      this.rconConnection.connect();
    });
  }

  public stop() {
    this.rconConnection.disconnect();
    this.javaServer.stop();
  }
}
