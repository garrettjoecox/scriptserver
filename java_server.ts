import { EventEmitter } from "https://deno.land/std@0.93.0/node/events.ts";
import { iter } from "https://deno.land/std@0.93.0/io/util.ts";
import { Config } from "./config.ts";

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

const DEFAULT_CONFIG = {
  jar: "server.jar",
  args: ["-Xmx1024M", "-Xms1024M"],
  path: "./server",
  pipeStdout: true,
  pipeStdin: true,
};

const textDecoder = new TextDecoder();

export class JavaServer extends EventEmitter {
  private config: Config;
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
