import { EventEmitter } from "https://deno.land/std@0.93.0/node/events.ts";
import { iter } from "https://deno.land/std@0.93.0/io/util.ts";
import { Config } from "./config.ts";
import { Buffer } from "https://deno.land/std@0.93.0/node/buffer.ts";

export interface JavaServerConfig {
  jar: string;
  args: string[];
  path: string;
  pipeStdout: boolean;
  pipeStdin: boolean;
}

declare module "./config.ts" {
  export interface Config {
    javaServer: JavaServerConfig;
  }
}

export interface JavaServerEvents {
  console: (consoleLine: string) => void;
}

const DEFAULT_CONFIG: JavaServerConfig = {
  jar: "server.jar",
  args: ["-Xmx1024M", "-Xms1024M"],
  path: "./server",
  pipeStdout: true,
  pipeStdin: true,
};

const textDecoder = new TextDecoder();

export class JavaServer extends EventEmitter {
  // @ts-expect-error
  on<U extends keyof JavaServerEvents>(
    event: U,
    listener: JavaServerEvents[U]
  ): this;

  // @ts-expect-error
  emit<U extends keyof JavaServerEvents>(
    event: U,
    ...args: Parameters<JavaServerEvents[U]>
  ): boolean;
  public config: Config;
  private process?: Deno.Process;

  constructor(config: Partial<Config> = {}) {
    super();
    this.config = { javaServer: DEFAULT_CONFIG, ...config } as Config;

    this.stdinIter();
  }

  public start() {
    this.process = Deno.run({
      cwd: this.config.javaServer.path,
      cmd: [
        "java",
        ...this.config.javaServer.args,
        "-jar",
        this.config.javaServer.jar,
        "nogui",
      ],
      stdout: "piped",
      stderr: "piped",
      stdin: "piped",
    });

    this.stdoutIter();
    this.stderrIter();
  }

  public send(message: string) {
    if (!this.process || !this.process.stdin) return;

    this.process.stdin.write(Buffer.from(message + "\n"));
  }

  private async stdoutIter() {
    try {
      if (this.process?.stdout && this.config.javaServer.pipeStdout) {
        for await (const chunk of iter(this.process.stdout)) {
          Deno.stderr.write(chunk);
          this.emit("console", textDecoder.decode(chunk));
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.stop();
    }
  }

  private async stderrIter() {
    try {
      if (this.process?.stderr && this.config.javaServer.pipeStdout) {
        for await (const chunk of iter(this.process.stderr)) {
          Deno.stderr.write(chunk);
          this.emit("console", textDecoder.decode(chunk));
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  private async stdinIter() {
    try {
      for await (const chunk of iter(Deno.stdin)) {
        if (this.process?.stdin && this.config.javaServer.pipeStdin) {
          this.process.stdin.write(chunk);
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  public stop() {
    if (!this.process) return;

    this.process.stdin?.close();
    this.process.stdout?.close();
    this.process.stderr?.close();
    this.process.close();

    this.process = undefined;
  }
}
