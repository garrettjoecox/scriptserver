const EventsEmitter = require( 'events' );
const { spawn } = require( 'child_process' );
const defaultsDeep = require( 'lodash.defaultsdeep' );

const Rcon = require( './rcon' );

const defaultConfig = {
  core: {
    jar: 'minecraft_server.jar',
    args: ['-Xmx2G'],
    pipeIO: false,
    spawnOpts: {
      stdio: ['pipe', 'pipe', 'inherit'],
    },
    rcon: {
      host: 'localhost',
      port: '25575',
      password: '0000',
      buffer: 25,
    },
    api: 'spigot',
    regex: {
      vanilla: {
        rcon_listening: /\[RCON Listener #1\/INFO\]: RCON running/i
      },
      spigot: {
        rcon_listening: /\ INFO]: RCON running on/i,
        server_stopped: /\ INFO]: Stopping server/i
      },
      bukkit: {
        rcon_listening: /\ INFO]: RCON running on/i
      }
    }
  }
};

class Minecraft extends EventsEmitter {

  constructor( config = {} ) {

    super();
    this.config = defaultsDeep( {}, config, defaultConfig );
    this.api = this.config.core.api;
    this.modules = [];

    this.hasStarted = false;
    this.hasRunning = false;
    this.hasRestart = false;
    this.hasStopped = true;

    // RCON
    this.rcon = new Rcon( this.config.core.rcon );
    this.on( 'console', ( l ) => {
      if( l.match(this.config.core.regex[this.api].rcon_listening ) ) {

        // Connect to RCON
        this.rcon.connect();

        if( this.hasRunning == false ) {

          // Mark server as running
          this.hasRunning = true;

          // Emit that the server is running
          this.emit( 'status', {
            event: 'started',
            message: 'Minecraft server has now started up and is running.'
          } );

        }

      }
    } );

    process.on( 'exit', () => this.stop() );
    process.on( 'close', () => this.stop() );

  }

  start() {

    if( this.spawn ) throw new Error( 'Server already started' );

    this.hasStopped = false;

    const args = this.config.core.args.concat( '-jar', this.config.core.jar, 'nogui' );
    this.spawn = spawn( 'java', args, this.config.core.spawnOpts );

    if( this.config.core.pipeIO ) {
      this.spawn.stdout.pipe( process.stdout );
      process.stdin.pipe( this.spawn.stdin );
    }

    this.spawn.stdout.on( 'data', ( d ) => {
      d.toString().split( '\n' ).forEach(( l ) => {
        if( l ) {

          // Check if server just started and emit starting status
          if( this.hasStarted == false && this.hasStopped == false ) {

            this.emit( 'status', {
              event: 'starting',
              message: 'Minecraft server is now starting up.'
            } );

            this.hasStarted = true;
          }

          // Emit to console
          this.emit( 'console', l );

        }
      } );
    } );

    return this;

  }

  stop() {

    if( this.spawn ) {

      this.spawn.kill();
      this.spawn = null;
      this.hasStopped = true;

    }

    this.emit( 'status', {
      event: 'stopped',
      message: 'Minecraft server has now been completely stopped.'
    } );

    this.hasStarted = false;
    this.hasRunning = false;

    if( this.hasRestart == true ) {

      this.hasRestart = false;

      return this.start();

    }

    return this;

  }

  consoleStop() {

    var variable = this;

    variable.hasRestart = false;

    variable.emit( 'status', {
      event: 'stopping',
      message: 'Minecraft server will shut down in 10 seconds.'
    } );

    variable.util.tellRaw( `Mineland serveren vil slå seg av om 10 sekunder.`, '@e', { color: 'red' } );

    setTimeout( function() {
      variable.stop();
    }, 10000 );

  }

  consoleRestart() {

    var variable = this;

    variable.hasRestart = true;

    variable.emit( 'status', {
      event: 'restart',
      message: 'Minecraft server will restart in 10 seconds.'
    } );

    variable.util.tellRaw( `Mineland serveren vil starte på nytt om 10 sekunder.`, '@e', { color: 'red' } );

    setTimeout( function() {
      variable.stop();
    }, 10000 );

  }

  use( module ) {

    if( typeof module !== 'function' ) throw new Error( '[Minecraft] A module must be a function.' );

    if( this.modules.filter( m => m === module ).length === 0 ) {

      this.modules.push( module );
      module.call( this );

    }

    return this;

  }

  send( command ) {

    return new Promise( ( resolve ) => {
      this.rcon.exec( command, result => resolve( result ) );
    } );

  }

  sendRaw( command ) {

    return new Promise( ( resolve ) => {
      this.spawn.stdin.write( `${command}\n` );
    } );

  }

  isRunning() {

    if( this.hasRunning ) return true;
    return false;

  }

}

module.exports = Minecraft;
