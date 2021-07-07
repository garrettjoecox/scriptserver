import EventsEmitter from 'events';
import { DEFAULT_JAVA_SERVER_CONFIG, JavaServer, JavaServerConfig } from './JavaServer';
import { DEFAULT_RCON_CONNECTION_CONFIG, RconConnection, RconConnectionConfig } from './RconConnection';

export interface ScriptServerEvents {
  console: (message: string) => void;
  started: () => void;
  stopped: () => void;
}

export interface ScriptServerConfig {
  core: {
    javaServer: JavaServerConfig;
    rconConnection: RconConnectionConfig;
  };
}

export const DEFAULT_SCRIPT_SERVER_CONFIG: ScriptServerConfig = {
  core: {
    javaServer: DEFAULT_JAVA_SERVER_CONFIG,
    rconConnection: DEFAULT_RCON_CONNECTION_CONFIG,
  },
};

export interface ScriptServerExt {}

export interface ScriptServer {
  on<U extends keyof ScriptServerEvents>(event: U, listener: ScriptServerEvents[U]): this;
  emit<U extends keyof ScriptServerEvents>(event: U, ...args: Parameters<ScriptServerEvents[U]>): boolean;
}

export class ScriptServer extends EventsEmitter {
  public config: ScriptServerConfig = DEFAULT_SCRIPT_SERVER_CONFIG;
  private javaServer: JavaServer;
  private rconConnection: RconConnection;
  public ext: ScriptServerExt = {};

  constructor(config: Partial<ScriptServerConfig> = {}) {
    super();

    Object.assign(this.config, config);
    this.javaServer = new JavaServer(this.config.core.javaServer);
    this.rconConnection = new RconConnection(this.config.core.rconConnection);

    this.javaServer.on('console', message => this.emit('console', message));
    this.javaServer.on('stopped', () => this.emit('stopped'));
    this.rconConnection.on('connected', () => this.emit('started'));
  }

  public start() {
    this.javaServer.start();
    this.javaServer.once('started', () => {
      this.rconConnection.connect();
    });
  }

  public send(message: string): Promise<string> {
    return this.rconConnection.send(message);
  }

  public sendConsole(message: string) {
    return this.javaServer.send(message);
  }
}
