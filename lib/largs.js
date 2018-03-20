const debug = require('debug')('dply:largs:largs')
const { ArgumentError, ArgumentsError, LargsError } = require('./errors')
const { Arg } = require('./arg')
const forEach = require('lodash.foreach')
const padEnd = require('lodash.padend')



class Largs {

  constructor( label ){
    this._label = label
    this.reset()
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
   * @return {Arg} - The argument being setup
   */
  option( ...args ){ return this.arg( ...args ) }
  arg( str ){
    return this.config_options[str] = new Arg(str)
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
    forEach(args, (config, argname) => {
      let o = this.config_options[argname] = new Arg(argname)
      forEach(config, (value, argsetting) => {
        if (!o[argsetting]) throw new LargsError(`No method ${argsetting} to apply for ${argname}`, argname)
        o[argsetting](value)
      })
    })
    return this
  }

  // Setup a command
  //
  //     command(str){
  //       this.config_commands[str] = new Command(str)
  //     }

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
   * @returns {Largs} - Largs instance to continue chaining
   */
  help( options = {} ){
    options = Object.assign({ exit: true, exit_code: 0 }, options)
    this._help = true

    let fn = ( largs, help_arg )=> {
      debug('running help handler', help_arg._provided)
      let header = this._label || ''
      if ( this._version ) header += ` ${this._version}`
      process.stdout.write(header + '\n')
      process.stdout.write('\n')
      process.stdout.write('Help:\n')
      this.eachArgByGroup(arg => {
        let long  = (arg._long) ? padEnd(`--${arg._long}`, 14) : padEnd('',14)
        let short = padEnd((arg._short || ''), 2)
        let help  = arg._help || arg._description || ''
        console.log('  -%s  %s  - %s', short, long, help) // eslint-disable-line no-console
      })

      // Check if we should exit, and that we got a -h or --help
      debug('in help handler options', options, this.config_options['help'].wasProvided())
      if ( options.exit && this.config_options['help'].wasProvided() ) {
        process.exit(options.exit_code)
      }
    }

    this.arg('help')
      .short('h')
      .type('flag')
      .description('This help')
      .group('zdefault')
      .handler(fn)

    return this
  }

  /**
   * Setup -v/--version automaticatically
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


  // ### Errors

  unknownError( str ){
    throw new ArgumentError(`The "${str}" argument is unknown`)
  }

  processError(description, arg, full ){
    if (full) full = ` in "${full}"`
    throw new ArgumentError(`${description} "${arg}"${full}`)
  }


  // ### Arg Processing

  // Fix multiargs
  normaliseArgv( argv ){

    forEach( argv, (arg, i) => {
      if ( arg[0] !== '-' ) return

      // Detect some mishaps
      if ( !arg[1] ) this.processError('No argument', arg)
      if ( arg[1] === '-' && !arg[2] ) this.processError('No argument', arg)
      if ( arg[1] === '-' && arg[2] === '-' ) this.processError('Invalid argument', arg)

      // We don't care about single args
      if ( arg[1] !== '-' && arg.length === 2 ) return

      // or long args
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
    if ( !arg ) this.unknownError(short)
    let slurped = arg.loadArgv(argv, short)
    return argv.slice(slurped)
  }

  processLong( long, argv ){
    let arg = this.lookupLong(long)
    if ( !arg ) this.unknownError(long)
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

  processArgv( argv ){
    debug('processArgv', argv)

    this.normaliseArgv(argv)

    let short_re = /^-([^-].*)/
    let long_re = /^--(.*)/
    let m

    while ( argv.length > 0 ) {
      let arg = argv.shift()

      if ( arg[0] !== '-' ) {
        // Positional
        debug('Positional "%s"', arg)
        this.processPositional(arg)
      }
      else if (( m = arg.match(short_re) )) {
        // Short
        let short_arg = m[1]
        debug('Short "%s"', short_arg, arg, argv[0])
        argv = this.processShort(short_arg, argv)
      }
      else if (( m = arg.match(long_re) )) {
        // Long
        let long_arg = m[1]
        debug('Long "%s"', long_arg, arg, argv.slice(0,2))
        argv = this.processLong(long_arg, argv)
      }
      else {
        // Unknown
        throw new LargsError('Unknown argument processing error', arg, argv)
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
      throw ArgumentsError.build('Missing required arguments', required_errors)
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
      throw new ArgumentError(msg)
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
    debug('Go processing argv', process_argv)
    debug('Go config', this.config_options)
    this.binary = process_argv[0]
    this.script = process_argv[1]
    if ( ! this._label ) this._label = this.script
    this.processArgv(process_argv.slice(2))
    if ( this._handler ){
      return this._handler(this.getOptions(), this)
    }
    return this.getOptions()
    //return this.toJSON()
  }

  // `.run` is the public entry point to processing
  run( process_argv = process.argv.slice() ){
    try {
      return this.go(process_argv)
    } catch (error) {
      debug('run error', error)
      if ( error.name === 'ArgumentError' || error.name === 'ArgumentsError') {
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

  toOptionsObject(){
    let o = {}
    this.eachArg((arg, key) => {
      o[key] = this.config_options[key].getValue()
    })
    if ( this.config_positional.length > 0 ){
      o.positional = []
      this.eachPositionalArg(arg => o.positional.push(arg._value))
    }
    return o
  }

  toConfigObject(){
    let o = {}
    this.eachArg((arg, key) => {
      o[key] = this.config_options[key].toJSON()
    })
    return o
  }

}


module.exports = { Largs, Arg, ArgumentError }
