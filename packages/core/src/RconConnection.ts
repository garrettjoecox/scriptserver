import EventsEmitter from 'events';
import Net, { Socket } from 'net';
import defaultsDeep from 'lodash.defaultsdeep';
import { Config, DeepPartial } from './Config';

export interface RconConnectionConfig {
  host: string;
  port: number;
  password: string;
  buffer: number;
}

declare module './Config' {
  export interface Config {
    rconConnection: RconConnectionConfig;
  }
}

export const DEFAULT_RCON_CONNECTION_CONFIG: RconConnectionConfig = {
  host: 'localhost',
  port: 25575,
  password: '0000',
  buffer: 100,
};

interface RconConnectionEvents {
  connected: () => void;
  disconnected: () => void;
}

export declare interface RconConnection {
  on<U extends keyof RconConnectionEvents>(event: U, listener: RconConnectionEvents[U]): this;

  emit<U extends keyof RconConnectionEvents>(event: U, ...args: Parameters<RconConnectionEvents[U]>): boolean;
}

export class RconConnection extends EventsEmitter {
  public config: Config;
  private connection?: Socket;
  private authenticated: boolean = false;
  private queue: [string, (value: string) => void][] = [];
  private promises: { [execId: number]: (value: string) => void } = {};
  private execId: number = RequestPacketId.Exec;

  constructor(config: DeepPartial<Config> = {}) {
    super();

    this.config = defaultsDeep(config, { rconConnection: DEFAULT_RCON_CONNECTION_CONFIG });

    this.tick();
  }

  public connect(retry = true) {
    this.connection = Net.connect(
      {
        host: this.config.rconConnection.host,
        port: this.config.rconConnection.port,
      },
      () => {
        this.listen();
        this.connection?.write(
          encode(RequestPacketType.Auth, RequestPacketId.Auth, this.config.rconConnection.password),
        );
      },
    );
    this.connection.on('error', error => {
      if (retry && (error as any).code === 'ECONNREFUSED') {
        console.log('Unable to connect, retrying...');
        setTimeout(() => this.connect(retry), 1000);
      } else {
        console.error(error.message);
      }
    });
  }

  public disconnect() {
    this.connection?.destroy();
    this.connection = undefined;
    this.authenticated = false;
    this.queue = [];
    this.promises = {};
    this.emit('disconnected');
  }

  public send(message: string): Promise<string> {
    return new Promise(resolve => {
      this.queue.push([message, resolve]);
    });
  }

  private listen() {
    this.connection?.on('data', chunk => {
      const packet = decode(chunk);
      if (packet.type === ResponsePacketType.Auth && packet.id === RequestPacketId.Auth) {
        this.authenticated = true;
        this.emit('connected');
      } else if (packet.type === ResponsePacketType.Exec) {
        this.promises[packet.id]?.(packet.body);
      } else {
        console.log('Unknown Packet Type:', packet);
      }
    });
  }

  private tick() {
    if (this.connection && this.authenticated && this.queue.length) {
      const [message, promise] = this.queue.shift()!;
      const execId = this.getNextExecId();
      this.promises[execId] = promise;

      this.connection.write(encode(RequestPacketType.Exec, execId, message));
    }

    setTimeout(() => this.tick(), this.config.rconConnection.buffer);
  }

  private getNextExecId(): number {
    return (this.execId += 1);
  }
}

enum RequestPacketType {
  Auth = 0x03,
  Exec = 0x02,
}

enum RequestPacketId {
  Auth = 0x123,
  Exec = 0x321,
}

enum ResponsePacketType {
  Auth = 0x02,
  Exec = 0x00,
}

function encode(type: RequestPacketType, id: RequestPacketId, body: string) {
  const size = Buffer.byteLength(body) + 14;
  const buffer = Buffer.alloc(size);

  buffer.writeInt32LE(size - 4, 0);
  buffer.writeInt32LE(id, 4);
  buffer.writeInt32LE(type, 8);
  buffer.write(body, 12, size - 2);
  buffer.writeInt16LE(0, size - 2);

  return buffer;
}

function decode(chunk: Uint8Array) {
  const buffer = Buffer.from(chunk);

  return {
    size: buffer.readInt32LE(0),
    id: buffer.readInt32LE(4),
    type: buffer.readInt32LE(8),
    body: buffer.toString('utf8', 12, buffer.length - 2),
  };
}
