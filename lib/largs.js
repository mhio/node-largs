const debug = require('debug')('mhio:largs:largs')
const { ArgumentException, ArgumentsException, LargsException } = require('./exceptions')
const { Arg } = require('./arg')
const forEach = require('lodash.foreach')
const padEnd = require('lodash.padend')



class Largs {

  /**
   * Create a largs instance and run processing
   * Main entry point for users
   *
   * @param      {Object}  options  The options
   */
  static run( options, { process_argv = null } = {} ){
    const l = new this()
    l.args(options)
    const opts = largs.run(process_argv)
    return opts
  }

  /**
   * Create a largs instance ang go
   * Main entry point for users who want to control `process`
   *
   * @param      {Object}  options  The options
   */
  static go( options, { process_argv = null } = {} ){
    const l = new this()
    l.args(options)
    const opts = l.go(process_argv)
    return opts
  }

  constructor( label, options = {} ){
    this._label = label
    this.reset()

    // Sub commands
    this._parent =  null
    this._command = null
    if (options.parent) {
      this._parent =  options.parent
      this._command = label
    }
  }

  // Reset the Largs config
  reset(){
    this.config_options = {}
    this.config_commands = {}
    this.config_positional = []
    this.processed_positional = 0
    this._help = false
    delete this._version
    return this
  }

  label( label ){
    this._label = label
    return this
  }

  /**
   * @summary Setup a single option/argument
   * @param {string} arg_name - The name of the argument
   * @return {Arg} - The argument object to setup
   */
  option( ...args ){ return this.arg( ...args ) }
  arg( arg_name ){
    if ( ! arg_name ) throw new LargsException('No argument name to setup')
    if ( arg_name === 'positional' ) throw new LargsException('Argument name "positional" is reserved')
    if ( ! arg_name.startsWith ) throw new LargsException('Argument names should be a string')
    if ( arg_name.startsWith('command_') ) throw new LargsException('Arguments named "command_*" are reserved')
    if (this.config_commands[arg_name]){
      throw new LargsException('Options [${name}] conflicts with command')
    }
    // This changes to the `Arg` scope, might mess up the API
    return this.config_options[arg_name] = new Arg(arg_name)
  }

  /**
   * @summary Setup an object of options/arguments
   * @description Use one config blob to setup all args instead of
   * arg by arg.
   *     {
   *       what: { long: 'what', short: 'a', type: 'integer' }, // --what/-a
   *       that: { type: 'string' },  // --that/-t
   *     }
   * @params {object} args - Arguments, properties matching Largs api functions.
   * @returns {Largs}
   */
  options( ...options ){ return this.args( ...options ) }
  args( args ){
    forEach(args, (config, arg_name) => {
      // Trap commands
      if (arg_name.startsWith('command_')){
        debug('found command')
        const command_name = arg_name.substring(8)
        this.command( command_name, config )
        return
      }
      // Normal arg
      let o = this.arg(arg_name)
      forEach(config, (value, argsetting) => {
        if (!o[argsetting] || typeof o[argsetting] !== 'function' ) {
          throw new LargsException(`Invalid setting "${argsetting}" for "${arg_name}"`, { arg_name })
        }
        o[argsetting](value)
      })
    })
    return this
  }

  /**
   * Setup a positional argument
   * @returns {Arg} - Arg object to configure
   */
  positional(){
    let next = this.config_positional.length + 1
    let arg = new Arg(next)
    this.config_positional.push(arg)
    return arg
  }
  
  /**
   * Sets up a sub command, which is another `largs` instance
   *
   * @param      {<type>}  name       The name
   * @param      {<type>}  [opts={}]  The options
   * @returns {Largs} command
   */
  command( cmd_name, largs_config = null, opts = {}){
    if (this.config_options[cmd_name]){
      throw new LargsException('Command [${cmd_name}] conflicts with option')
    }
    const sub_command = new Largs(cmd_name, { parent: this })
    if (largs_config) {
      debug('have command config, setting up', largs_config)
      sub_command.args(largs_config)
    }
    this.config_commands[cmd_name] = sub_command
    return sub_command
  }

  /**
   * @summary Set a larg handler to run before returning
   * @description
   * @params {function} - Function to handle largs object before finishing
   * @returns {Arg} - `Arg` object to configure
   */
  handler(...args){ this.setHandler(...args) } // deprecated in 0.3
  setHandler(fn){
    this._handler = fn
  }

  /**
   * Setup -h/--help automaticatically
   * @params {object} options
   * @params {Boolean} options.exit - Should node exit after help
   * @params {Boolean} options.exit_code - What exit code should be used when exiting
   * @params {Boolean} options.verbose - Use a line for options and lines for description
   * @params {Function} options.handler - Custom help handler, params `larg{Largs}, help_arg{Arg}`
   * @returns {Largs} - Largs instance to continue chaining
   */
  help( options = {} ){
    const self = this
    options = Object.assign({ exit: true, exit_code: 0, verbose: false, handler: defaultHelpHandler }, options)
    this._help = true

    function defaultHelpHandler( largs, help_arg ){
      debug('running help handler', help_arg._provided)
      let header = self._label || ''
      if ( self._version ) header += ` ${self._version}`
      process.stdout.write(header + '\n')
      process.stdout.write('\n')
      process.stdout.write('Help:\n')

      if ( options.verbose ) {
        self.eachArgByGroup(arg => {
          let long  = (arg._long) ? padEnd(`--${arg._long}`, 16) : padEnd('',16)
          let short = (arg._short) ? padEnd(`-${arg._short}`, 3) : padEnd('',3)
          let type  = arg._type
          let required = (arg._required) ? 'required' : ''
          let help  = arg._help || arg._description || ''
          console.log('  %s  %s  %s {%s}', short, long, required, type) // eslint-disable-line no-console
          console.log('            %s', help) // eslint-disable-line no-console
          process.stdout.write('\n')
        })
      }
      else {
        self.eachArgByGroup(arg => {
          let long  = (arg._long) ? padEnd(`--${arg._long}`, 14) : padEnd('',14)
          let short = (arg._short) ? padEnd(`-${arg._short}`, 3) : padEnd('',3)
          let help  = arg._help || arg._description || ''
          console.log('  %s  %s  - %s', short, long, help) // eslint-disable-line no-console
        })
        process.stdout.write('\n')
      }


      // Check if we should exit, and that we got a -h or --help
      debug('in help handler options', options, self.config_options['help'].wasProvided())
      if ( options.exit && self.config_options['help'].wasProvided() ) {
        process.exit(options.exit_code)
      }
    }

    this.arg('help')
      .short('h')
      .type('flag')
      .description('This help')
      .group('zdefault')
      .handler(options.handler)

    return this
  }

  /**
   * Setup -v/--version automaticatically
   * @description Setup a default version handler.
   * ```
   * let {version} = require(../package.json)
   * largs.version(version)
   * ```
   * @params {string} version - Version to print to user
   * @returns {Largs} - Largs instance to continue chaining
   */
  version( version ){
    this._version = version

    let versionHandler = function versionHandler( largs, version_arg ){
      debug('running version handler', version_arg)
      console.log(version) // eslint-disable-line no-console
      process.exit(0)
    }

    this.arg('version')
      .short('v')
      .type('flag')
      .description('Display the version')
      .group('zdefault')
      .handler(versionHandler)

    return this
  }




  // ### Arg lookups

  /**
   * Loop over each arg
   * @params {function} - Function to run against each arg.
   * @returns {undefined}
   */
  eachArg( fn ){
    return forEach(this.config_options, fn)
  }

  /**
   * Loop over each arg in group alpabetical order
   * Can supply a custom `Array.sort` compare method
   * @params {function} - Function to run against each arg
   * @params {function} - Compare function for `Array#sort`
   * @returns {undefined}
   */
  eachArgByGroup( fn, compare ){
    if (!compare) compare = (a, b) => a._group.localeCompare(b._group)
    let ordered = []
    this.eachArg(arg => ordered.push(arg))
    ordered.sort(compare)
    return forEach(ordered, fn)
  }

  // Loop over each arg in a single group
  // eachArgInGroup( group, fn ){
  //   let o = this.findArgs('_group', group)
  //   return forEach( o, fn )
  // }

  /**
   * Loop over each positional argument
   * @params {function} - Function to run against each positional argument
   * @returns {undefined}
   */
  eachPositionalArg( fn ){
    return forEach(this.config_positional, fn)
  }

  eachCommand( fn ){
    return forEach(this.config_commands, fn)
  }

  /**
   * Determines whether the specified name is command.
   *
   * @param      {string}  cmd_name    The command name
   * @return     {object}  Truthey if the specified name is command, Undefined otherwise.
   */
  isCommand( cmd_name ) {
    return this.config_commands[cmd_name]
  }

  /**
   * Find first arg that have property == value
   * @params {string} property - Name of argument
   * @params {any} value - Property value to match against
   * @returns {Arg} `Arg` object for argument
   */
  findArg( property, value ){
    let ret = false
    this.eachArg(arg => {
      if ( arg[property] === value ) {
        ret = arg
        return false
      }
    })
    return ret
  }

  /**
   * Find all arguments that have property == value
   * @params {string} property - Name of argument
   * @params {Arg} value - `Arg` object for argument
   * @returns {object}
   */
  findArgs( property, value ){
    let o = {}
    this.eachArg((arg, key) => {
      if ( arg[property] === value ) o[key] = arg
    })
    return o
  }

  /**
   * Lookup an argument by its short property
   * @params {string} short_opt - Short option of argument
   * @returns {Arg} `Arg` object for argument
   */
  lookupShort( short_opt ){
    return this.findArg('_short', short_opt)
  }

  /**
   * Lookup an argument by its long property
   * @params {string} long_opt - Long option of argument
   * @returns {Arg} `Arg` object for argument
   */
  lookupLong( long_opt ){
    return this.findArg('_long', long_opt)
  }

  /**
   * Lookup an arg argument it's label/name property
   * @params {string} name - Name of argument
   * @returns {Arg} `Arg` object for argument
   */
  lookupName( name ){
    return this.findArg('_name', name)
  }

  /**
   * Lookup arguments by their group
   * @params {string} group_name - Name of group to return
   * @returns {Arg} `Arg` object for argument
   */
  lookupGroup( group_name ){
    return this.findArgs('_group', group_name)
  }

  listShortArgs(){
    const args = []
    this.eachArg(arg => {
      // dodge internals
      if (arg._short) args.push(arg._short)
    })
    return args
  }
  listLongArgs(){
    const args = []
    this.eachArg(arg => { 
      // dodge internals
      if (arg._long) args.push(arg._long)
    })
    return args
  }


  // ### Errors

  unknownError( str, alternates = []){
    debug('unknownError alternates', alternates)
    let msg = `The "${str}" argument is unknown`
    if (this._command) {
      msg += ` for command "${this._command}"`
    }
    if (alternates && alternates.length) {
      msg += `. ${JSON.stringify(alternates)}`
    }
    throw new ArgumentException(msg)
  }

  processError(description, arg, full_args ){
    let full_str = ''

    // Do some processing if we have full_args and it's an array
    if (full_args) {
      let full_args_str = ( full_args.join )
        ? full_args.join(' ')
        : full_args
      full_str = ` in "${full_args_str}"`
    }

    throw new ArgumentException(`${description} "${arg}"${full_str}`)
  }


  // ### Arg Processing

  /** Fix multiargs like `-mfa` into `-m -f -a`*/
  normaliseArgv( argv ){

    forEach( argv, (arg, i) => {
      // Ignore any non options
      if ( arg[0] !== '-' ) return

      // Detect some mishaps

      // `-` can possibly be stdin!?
      if ( !arg[1] ) return
      //if ( !arg[1] ) this.processError('No argument on', arg, argv)

      // `--` can be end of args
      if ( arg[1] === '-' && !arg[2] ) return
      //if ( arg[1] === '-' && !arg[2] ) this.processError('No argument on', arg, argv) args

      // `---` nope - but do we really need to error? in case someone wants to use `---`
      if ( arg[1] === '-' && arg[2] === '-' ) this.processError('Invalid argument', arg, argv)

      // We don't need to normalize already single args `-x`
      if ( arg[1] !== '-' && arg.length === 2 ) return

      // or long args that are left over `--whatever`
      if ( arg[1] === '-' ) return

      // Seperate multiple args out
      debug('normalise found a short arg with multiple opts', arg)
      argv.splice(i, 1)
      let arg_length = arg.length
      forEach( arg.slice(1), (letter, j) => {
        if ( j+2 < arg_length ) {
          let arg_conf = this.lookupShort(letter)
          if ( arg_conf && !arg_conf.isFlag() )
            this.processError('Combined arguments can only be flags.', letter, arg)
        }
        argv.splice(j, 0, `-${letter}`)
      })
      debug('normalise set argv', argv)
      //debug('plain arg', arg)
    })

    this.argv = argv
  }

  processShort( short, argv ){
    let arg = this.lookupShort(short)
    if ( !arg ) this.unknownError(short, this.listShortArgs())
    let slurped = arg.loadArgv(argv, short)
    return argv.slice(slurped)
  }

  processLong( long, argv ){
    let arg = this.lookupLong(long)
    if ( !arg ) this.unknownError(long, this.listLongArgs())
    let slurped = arg.loadArgv(argv, long)
    return argv.slice(slurped)
  }

  // Process a positional argument
  processPositional( arg ){
    // Positionals might not be setup, take them in anyway
    if ( this.config_positional.length === this.processed_positional ) {
      this.positional()
    }
    this.config_positional[this.processed_positional].loadArgv([arg])
    this.processed_positional += 1
  }

  /**
   * Process args in new command
   *
   * @param      {<type>}  name    The name
   * @param      {<type>}  args    The arguments
   */
  processCommand( name, args ){
    const cmd = this.isCommand(name)
    if (!cmd) throw new LargsException(`Can't process [${name}] as it's not a command`)
    cmd.processArgs(args)
  }

  /**
   * Process args component of argv
   *
   * @param      {<type>}  argv_whole  The arguments array whole
   * @return     {<type>}  { description_of_the_return_value }
   */
  processArgs( args_minus_node ){
    let args = args_minus_node.slice(0)
    debug('process args', args)

    this.normaliseArgv(args)

    let short_re = /^-([^-].*)/
    let long_re = /^--(.*)/
    let m

    while ( args.length > 0 ) {
      let arg = args.shift()

      if ( arg === '--' ) {
        // done
        args = []
      }
      else if ( arg[0] !== '-' ) {
        // Positional or command
        debug('Positional or Command "%s"', arg)
        if (this.isCommand(arg)){
          // Inject the rest of args into the command
          debug('Process found command [%s] it\'s largs all the way down: %j', arg, args)
          this.processCommand(arg, args)
          // Everythings been sent down a level, we're done at the top \o/
          args = []
        } else {
          this.processPositional(arg)
        }
      }
      else if (( m = arg.match(short_re) )) {
        // Short
        let short_arg = m[1]
        debug('Process found short "%s" arg[%s] next:', short_arg, arg, args[0])
        args = this.processShort(short_arg, args)
      }
      else if (( m = arg.match(long_re) )) {
        // Long
        let long_arg = m[1]
        debug('Process found long "%s" arg[%s] next:', long_arg, arg, args.slice(0,2))
        args = this.processLong(long_arg, args)
      }
      else {
        // Unknown
        throw new LargsException('Unknown argument processing error', arg, args)
      }
    }

    // Check all required paramaters and validation
    let required_errors = []
    this.eachArg( arg => {
      if ( arg.isRequired() && arg._value === undefined ){
        required_errors.push(`"${arg.required_arg}" is required`)
      }
    })
    if ( required_errors.length > 0 ) {
      debug('required errors!', required_errors.length)
      // Dump the help if we can
      let arg = this.lookupName('help')
      if ( arg && arg._handler ) arg._handler(this, arg)
      throw ArgumentsException.build('Missing required arguments', required_errors)
    }

    // Check for required positional paramaters
    let positional_required = 0
    let positional_missing = false
    this.eachPositionalArg( arg => {
      if ( arg.isRequired() ) {
        positional_required += 1
        if ( arg._value === undefined ) positional_missing = true
      }
    })
    if ( positional_missing === true ) {
      let msg = ( positional_required === 1 )
        ? `${positional_required} argument is required`
        : `${positional_required} arguments are required`
      throw new ArgumentException(msg)
    }

    // Run any handlers
    this.eachArg( arg => {
      if ( arg.hasHandler() && arg.wasProvided() ) arg._handler(this, arg)
    })

    // All done processing
    return this.config_options
  }

  // Go with arg processing, not error handling, see `.run`
  go( process_argv = process.argv ){
    debug('go processing argv', process_argv)
    debug('go config has keys', Object.keys(this.config_options))
    this.binary = process_argv[0]
    this.script = process_argv[1]
    if ( ! this._label ) this._label = this.script
    this.processArgs(process_argv.slice(2))
    if ( this._handler ){
      return this._handler(this.getOptions(), this)
    }
    return this.getOptions()
    //return this.toJSON()
  }

  /**
   * `.run` is the main entry point to processing on the instance.
   *
   * @param      {<type>}  [process_argv=process.argv.slice()]  The process arguments array
   * @return     {Object}  POJO of options. include reference to `largs`
   */
  run( process_argv = process.argv.slice() ){
    try {
      return this.go(process_argv)
    } catch (error) {
      debug('run error', error)
      if ( error.name === 'ArgumentException' || error.name === 'ArgumentsException') {
        console.error(`Error: ${error.message}`) // eslint-disable-line no-console
      } else {
        console.error('Error', error) // eslint-disable-line no-console
      }
      process.exit(1)
    }
  }


  // ### To Objects

  toOptions(...args){this.getOptions(...args)} // should do it on prototype
  getOptions(){
    return this.toOptionsObject()
  }

  getConfig(){
    return this.toConfigObject()
  }

  getPositional(){
    return this.toOptionsObject().positional
  }

  // getCommand(){
  //   return this.toJSON().command
  // }
  conf(){
    return this.toJSON()
  }

  /**
   * Returns an options object representation of the provided options.
   * A `key` for each named option. 
   * `positional` contains the positional arguments
   * A `key` for any commands, that contains this same schema. 
   *
   * @return     {<type>}  Options object representation of the object.
   */
  toOptionsObject(){
    let o = {}
    this.eachArg((arg, key) => {
      o[key] = this.config_options[key].getValue()
    })
    if ( this.config_positional.length > 0 ){
      o.positional = []
      this.eachPositionalArg(arg => o.positional.push(arg._value))
    }
    this.eachCommand((arg, key) => {
      o[key] = arg.toOptionsObject()
      // or this?? there is protection for arg/command clashes
      // o[`command_${key}`] = arg.toOptionsObject()
    })

    // Attach the `largs` instance
    Object.defineProperty(o,'largs',{ enumerable: false, value: this })
    return o
  }

  /**
   * Returns a configuration object representation of the object.
   *
   * @return     {<type>}  Configuration object representation of the object.
   */
  toConfigObject(){
    let o = {}
    this.eachArg((arg, key) => {
      o[key] = this.config_options[key].toJSON()
    })
    this.eachCommand((cmd_config, cmd_name) => {
      o[`command_${cmd_name}`] = cmd.toOptionsObject()
    })
    return o
  }

}


module.exports = { Largs, Arg, ArgumentException }
