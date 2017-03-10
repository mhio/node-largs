const debug = require('debug')('dply:replacer:largs')
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
    return this.config_positional.push(new Arg(next))
  }

  handler(){

  }

  // Setup -h/--help
  help(){
    this.arg('help')
      .short('h')
      .type('flag')
      .description('This help')
      .handler(()=> {
        console.log(`${this._label || ''} halp!`)
        this.eachArg(arg => {
          let long = padEnd(`--${arg._long}`, 14)
          let short = padEnd((arg._short || ''), 2)
          let help = arg._help || arg._description || ''
          console.log('  -%s  %s  - %s', short, long, help)
        })
        process.exit(0)
      })

    return this
  }

  // Setup -v/--version
  version(version){
    this.arg('version')
      .short('v')
      .type('flag')
      .description('Display the version')
      .handler(()=> {
        console.log(version)
        process.exit(0)
      })

    return this
  }
  // ### Arg lookups

  // Loop over each arg
  eachArg( fn ){
    return forEach(this.config, fn)
  }

  // Loop over each arg
  eachPositional( fn ){
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
  }

  processShort( short, argv ){
    let arg = this.lookupShort(short)
    if ( !arg ) this.unkownError(short)
    let slurped = arg.loadArgv(argv)
    return argv.slice(slurped)
  }

  processLong( long, argv ){
    let arg = this.lookupLong(long)
    if ( !arg ) this.unkownError(long)
    let slurped = arg.loadArgv(argv)
    return argv.slice(slurped)
  }

  // Process a positional argument
  processPositional( arg ){
    // Positionals might not be setup
    if ( this.config_positional.length === this.processed_positional ) {
      this.positional()
    }
    this.config_positional[this.processed_positional].value(arg)
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

    // Check all required arguments/validation
    this.eachArg( arg => {
      if ( arg.isRequired() && arg._value === undefined )
        throw new ArgumentError(`The "${arg.required_arg}" argument is required`)
    })

    // Check all required arguments/validation
    this.eachArg( arg => {
      if ( arg._handler ) arg._handler(this, arg)
    })

    // All done processing
    return this.config
  }

  // Go with arg processing
  go( process_argv = process.argv ){
    debug('Go processing argv', process_argv)
    this.binary = process_argv[0]
    this.script = process_argv[1]
    this.processArgv(process_argv.slice(2))
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
