import { spawn } from 'child_process';
import EventsEmitter from 'events';
import { ChildProcess } from 'node:child_process';

export interface JavaServerConfig {
  jar: string;
  args: string[];
  path: string;
  pipeStdout: boolean;
  pipeStdin: boolean;
  flavorSpecific: {
    startedRegExp: RegExp;
    stoppedRegExp: RegExp;
  };
}

export const DEFAULT_JAVA_SERVER_CONFIG: JavaServerConfig = {
  jar: 'server.jar',
  args: ['-Xmx1024M', '-Xms1024M'],
  path: './server',
  pipeStdout: false,
  pipeStdin: true,
  flavorSpecific: {
    startedRegExp: /^Thread RCON Listener started$/,
    stoppedRegExp: /^Thread RCON Listener stopped$/,
  },
};

interface JavaServerEvents {
  console: (message: string) => void;
  started: () => void;
  stopped: () => void;
}

export declare interface JavaServer {
  on<U extends keyof JavaServerEvents>(event: U, listener: JavaServerEvents[U]): this;

  emit<U extends keyof JavaServerEvents>(event: U, ...args: Parameters<JavaServerEvents[U]>): boolean;
}

export class JavaServer extends EventsEmitter {
  private config: JavaServerConfig = DEFAULT_JAVA_SERVER_CONFIG;
  private process?: ChildProcess;

  constructor(config: Partial<JavaServerConfig> = {}) {
    super();

    Object.assign(this.config, config);

    this.on('console', (message: string) => {
      if (message.match(this.config.flavorSpecific.startedRegExp)) this.emit('started');
      if (message.match(this.config.flavorSpecific.stoppedRegExp)) this.emit('stopped');
    });
  }

  public start() {
    if (this.process) {
      throw new Error('JavaServer already running');
    }

    this.process = spawn('java', [...this.config.args, '-jar', this.config.jar, 'nogui'], {
      cwd: this.config.path,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    if (this.config.pipeStdout) {
      this.process.stdout?.pipe(process.stdout);
      this.process.stderr?.pipe(process.stderr);
    }

    if (this.config.pipeStdin) {
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

    this.process.stdin?.write(message);
  }
}
