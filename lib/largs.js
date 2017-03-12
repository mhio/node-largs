const debug = require('debug')('dply:largs:largs')
const { ArgumentError, LargsError } = require('./errors')
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
    this.config = {}
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

  // Setup an option/argument
  option( ...args ){ return this.arg( ...args ) }
  arg( str ){
    return this.config[str] = new Arg(str)
  }

  // Setup a positional argument
  positional(){
    let next = this.config_positional.length + 1
    let arg = new Arg(next)
    this.config_positional.push(arg)
    return arg
  }

  handler(fn){
    this._handler = fn
  }

  // Setup -h/--help
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
        console.log('  -%s  %s  - %s', short, long, help)
      })

      // Check if we should exit, and that we got a -h or --help
      debug('in help handler options', options, this.config['help'].wasProvided())
      if ( options.exit && this.config['help'].wasProvided() ) {
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

  // Setup -v/--version
  version( version ){
    this._version = version

    let fn = (largs, version_arg )=> {
      debug('running version handler', version_arg)
      console.log(version)
      process.exit(0)
    }

    this.arg('version')
      .short('v')
      .type('flag')
      .description('Display the version')
      .group('zdefault')
      .handler(fn)

    return this
  }
  // ### Arg lookups

  // Loop over each arg
  eachArg( fn ){
    return forEach(this.config, fn)
  }

  // Loop over each arg in group alpabetical order
  // Can supply a custom `Array.sort` compare method
  eachArgByGroup( fn, compare ){
    if (!compare) compare = (a, b) => a._group.localeCompare(b._group)
    let ordered = []
    forEach(this.config, arg => ordered.push(arg))
    ordered.sort(compare)
    return forEach(ordered, fn)
  }

  // Loop over each arg in a single group
  eachArgInGroup( group, fn ){
    let o = this.findArgs('_group', group)
    return forEach( o, fn )
  }

  // Loop over each arg
  eachPositionalArg( fn ){
    return forEach(this.config_positional, fn)
  }

  // Find first arg that have property == value
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

  // Find all args that have property == value
  findArgs( property, value ){
    let o = {}
    this.eachArg((arg, key) => {
      if ( arg[property] === value ) o[key] = arg
    })
    return o
  }

  // Lookup an arg by the short property
  lookupShort( char ){
    return this.findArg('_short', char)
  }

  // Lookup an arg by the long property
  lookupLong( str ){
    return this.findArg('_long', str)
  }

  // Lookup an arg by it's label/name property
  lookupName( str ){
    return this.findArg('_name', str)
  }

  // Lookup args by their group
  lookupGroup( name ){
    return this.findArgs('_group', name)
  }


  // ### Errors

  unkownError( str ){
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
    if ( !arg ) this.unkownError(short)
    let slurped = arg.loadArgv(argv, short)
    return argv.slice(slurped)
  }

  processLong( long, argv ){
    let arg = this.lookupLong(long)
    if ( !arg ) this.unkownError(long)
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
    this.eachArg( arg => {
      let errors = []
      if ( arg.isRequired() && arg._value === undefined ){
        let e = new ArgumentError(`Error: The "${arg.required_arg}" argument is required`)
        errors.push(e)
      }
      if ( errors.length > 0 ) {
        debug('required errors!', errors.length)
        errors.forEach(error => {
          console.error(error.message)
        })

        // Dump the help if we can
        let arg = this.lookupName('help')
        if ( arg && arg._handler ) arg._handler(this, arg)
        process.exit(1)
      }
    })

    // Check for required positional paramaters
    let required = 0
    let missing = false
    this.eachPositionalArg( arg => {
      if ( arg.isRequired() ) {
        required += 1
        if ( arg._value === undefined ) missing = true
      }
    })
    if ( missing === true ) {
      if ( required === 1 ) console.error(`Error: ${required} argument is required`)
      else console.error(`Error ${required} arguments are required`)
      process.exit(1)
    }

    // Run any handlers
    this.eachArg( arg => {
      if ( arg.hasHandler() && arg.wasProvided() ) arg._handler(this, arg)
    })

    // All done processing
    return this.config
  }

  // Go with arg processing
  go( process_argv = process.argv ){
    debug('Go processing argv', process_argv)
    this.binary = process_argv[0]
    this.script = process_argv[1]
    if ( ! this._label ) this._label = this.script
    this.processArgv(process_argv.slice(2))
    if ( this._handler ){
      return this._handler(this.toOptions(), this)
    }
    return this.toOptions()
  }


  // ### To Objects

  toOptions(){
    return this.toJSON().options
  }

  toJSON(){
    let o = {
      config: {},
      options: {},
      positional: []
    }
    this.eachArg((arg, key)=> {
      o.config[key] = this.config[key].toJSON()
      o.options[key] = this.config[key].getValue()
    })
    this.eachPositional(arg => o.positional.push(arg._value))
    return o
  }

}


module.exports = { Largs, Arg, ArgumentError }
