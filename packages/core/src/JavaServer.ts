import { spawn } from 'child_process';
import EventsEmitter from 'events';
import { ChildProcess } from 'node:child_process';
import get from 'lodash.get';
import defaultsDeep from 'lodash.defaultsdeep';
import { Config, DeepPartial } from './Config';

export interface JavaServerConfig {
  jar: string;
  args: string[];
  path: string;
  pipeStdout: boolean;
  pipeStdin: boolean;
  flavorSpecific: {
    [flavor: string]: {
      startedRegExp: RegExp;
      stoppedRegExp: RegExp;
    };
  };
}

declare module './Config' {
  export interface Config {
    javaServer: JavaServerConfig;
  }
}

export const DEFAULT_JAVA_SERVER_CONFIG: JavaServerConfig = {
  jar: 'server.jar',
  args: ['-Xmx1024M', '-Xms1024M'],
  path: './server',
  pipeStdout: false,
  pipeStdin: true,
  flavorSpecific: {
    default: {
      startedRegExp: /^Thread RCON Listener started$/,
      stoppedRegExp: /^Thread RCON Listener stopped$/,
    },
  },
};

export interface JavaServerEvents {
  console: (message: string) => void;
  started: () => void;
  stopped: () => void;
}

export declare interface JavaServer {
  on<U extends keyof JavaServerEvents>(event: U, listener: JavaServerEvents[U]): this;

  emit<U extends keyof JavaServerEvents>(event: U, ...args: Parameters<JavaServerEvents[U]>): boolean;
}

export class JavaServer extends EventsEmitter {
  public config: Config;
  private process?: ChildProcess;

  constructor(config: DeepPartial<Config> = {}) {
    super();

    this.config = defaultsDeep(config, { javaServer: DEFAULT_JAVA_SERVER_CONFIG });

    this.on('console', (message: string) => {
      if (
        message.match(
          get(
            this.config,
            `javaServer.flavorSpecific.${this.config.flavor}.startedRegExp`,
            this.config.javaServer.flavorSpecific.default.startedRegExp,
          ),
        )
      ) {
        this.emit('started');
      }
      if (
        message.match(
          get(
            this.config,
            `javaServer.flavorSpecific.${this.config.flavor}.stoppedRegExp`,
            this.config.javaServer.flavorSpecific.default.stoppedRegExp,
          ),
        )
      ) {
        this.emit('stopped');
      }
    });
  }

  public start() {
    if (this.process) {
      throw new Error('JavaServer already running');
    }

    this.process = spawn('java', [...this.config.javaServer.args, '-jar', this.config.javaServer.jar, 'nogui'], {
      cwd: this.config.javaServer.path,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    if (this.config.javaServer.pipeStdout) {
      this.process.stdout?.pipe(process.stdout);
      this.process.stderr?.pipe(process.stderr);
    }

    if (this.config.javaServer.pipeStdin) {
      process.stdin.pipe(this.process.stdin!);
    }

    this.process.stdout?.on('data', (chunk: Buffer) => {
      chunk
        .toString()
        .split('\n')
        .forEach(message => {
          const trimmedMessage = message.match(/^\[\S+] \[[^\]]+]: (.+)/);
          if (trimmedMessage && trimmedMessage[1]) this.emit('console', trimmedMessage[1]);
        });
    });

    this.process.on('exit', () => {
      this.stop();
    });
    process.on('exit', () => {
      this.stop();
    });
  }

  public stop() {
    this.process?.kill();
    this.process = undefined;
  }

  public send(message: string) {
    if (!this.process) {
      throw new Error('JavaServer not running');
    }

    this.process.stdin?.write(message + '\n');
  }
}
