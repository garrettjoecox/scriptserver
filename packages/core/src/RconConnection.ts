import EventsEmitter from 'events';
import Net, { Socket } from 'net';

export interface RconConnectionConfig {
  host: string;
  port: number;
  password: string;
  buffer: number;
}

export const DEFAULT_RCON_CONNECTION_CONFIG: RconConnectionConfig = {
  host: 'localhost',
  port: 25575,
  password: '0000',
  buffer: 100,
};

export class RconConnection extends EventsEmitter {
  private config: RconConnectionConfig = DEFAULT_RCON_CONNECTION_CONFIG;
  private connection?: Socket;
  private authenticated: boolean = false;
  private queue: [string, (value: string) => void][] = [];
  private promises: { [execId: number]: (value: string) => void } = {};
  private execId: number = RequestPacketId.Exec;

  constructor(config: Partial<RconConnectionConfig> = {}) {
    super();

    Object.assign(this.config, config);
    this.tick();
  }

  public connect() {
    this.emit('connecting');
    this.connection = Net.connect(
      {
        host: this.config.host,
        port: this.config.port,
      },
      () => {
        this.listen();
        this.connection?.write(encode(RequestPacketType.Auth, RequestPacketId.Auth, this.config.password));
      },
    );
  }

  public disconnect() {
    this.emit('disconnecting');
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

    setTimeout(() => this.tick(), this.config.buffer);
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
