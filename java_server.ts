import { EventEmitter } from "https://deno.land/std@0.93.0/node/events.ts";
import { iter } from "https://deno.land/std@0.93.0/io/util.ts";

export interface JavaServerConfig {
  jar: string;
  args: string[];
  path: string;
  pipeStdout: boolean;
  pipeStdin: boolean;
}

const textDecoder = new TextDecoder();

export class JavaServer extends EventEmitter {
  private config: JavaServerConfig = {
    jar: "server.jar",
    args: ["-Xmx1024M", "-Xms1024M"],
    path: "./server",
    pipeStdout: true,
    pipeStdin: true,
  };
  private process?: Deno.Process;

  constructor(config: Partial<JavaServerConfig> = {}) {
    super();
    Object.assign(this.config, config);

    this.stdinIter();
  }

  public start() {
    this.process = Deno.run({
      cwd: this.config.path,
      cmd: ["java", ...this.config.args, "-jar", this.config.jar, "nogui"],
      stdout: "piped",
      stderr: "piped",
      stdin: "piped",
    });

    this.stdoutIter();
    this.stderrIter();
  }

  private async stdoutIter() {
    try {
      if (this.process?.stdout && this.config.pipeStdout) {
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
      if (this.process?.stderr && this.config.pipeStdout) {
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
        if (this.process?.stdin && this.config.pipeStdin) {
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
