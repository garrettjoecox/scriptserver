import { EventEmitter } from "https://deno.land/std@0.93.0/node/events.ts";
import { Buffer } from "https://deno.land/std@0.93.0/node/buffer.ts";
import { iter } from "https://deno.land/std@0.93.0/io/util.ts";

export interface RconConnectionConfig {
  host: string;
  rconPort: number;
  rconPassword: string;
  rconBuffer: number;
}

export class RconConnection extends EventEmitter {
  private config: RconConnectionConfig = {
    host: "localhost",
    rconPort: 25575,
    rconPassword: "0000",
    rconBuffer: 100,
  };

  private authenticated = false;
  private queue: [string, (value: string) => void][] = [];
  private promises: { [execId: number]: (value: string) => void } = {};
  private connection?: Deno.Conn;
  private execId: number = RequestPacketId.Exec;

  constructor(config: Partial<RconConnectionConfig> = {}) {
    super();
    Object.assign(this.config, config);

    this.tick();
  }

  public async connect() {
    this.connection = await Deno.connect({
      hostname: this.config.host,
      port: this.config.rconPort,
    });

    this.listen();

    this.connection.write(
      encode(
        RequestPacketType.Auth,
        RequestPacketId.Auth,
        this.config.rconPassword
      )
    );
  }

  private async listen() {
    try {
      if (this.connection) {
        for await (const chunk of iter(this.connection)) {
          const packet = decode(chunk);
          if (
            packet.type === ResponsePacketType.Auth &&
            packet.id === RequestPacketId.Auth
          ) {
            this.authenticated = true;
            this.emit("authenticated");
          } else if (packet.type === ResponsePacketType.Exec) {
            this.promises[packet.id]?.(packet.body);
          } else {
            console.log("Unknown Packet Type:", packet);
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.disconnect();
    }
  }

  public disconnect() {
    this.connection?.close();
    this.authenticated = false;
    this.connection = undefined;
    this.queue = [];
    this.promises = {};
  }

  public send(message: string) {
    return new Promise<string>((resolve) => {
      this.queue.push([message, resolve]);
    });
  }

  private tick() {
    if (this.connection && this.authenticated && this.queue.length) {
      const [message, promise] = this.queue.shift()!;
      const execId = this.getNextExecId();
      this.promises[execId] = promise;

      this.connection.write(encode(RequestPacketType.Exec, execId, message));
    }

    setTimeout(() => this.tick(), this.config.rconBuffer);
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
  const buffer = new Buffer(size);

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
    body: buffer.toString("utf8", 12, buffer.length - 2),
  };
}
