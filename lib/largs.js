const debug = require('debug')('dply:replacer:largs')
const { ArgumentError, LargsError } = require('./errors')
const { Arg } = require('./arg')
const forEach = require('lodash.foreach')


class Largs {

  constructor( label ){
    this.label = label
    this.reset()
  }

  // Reset the Largs config
  reset(){
    this.config = {}
    this.config_positional = []
    this.processed_positional = 0
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


  // ### Arg lookups

  // Loop over each arg
  eachArg( fn ){
    return forEach(this.config, fn)
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
  processShort( short, argv ){
    let arg = this.lookupShort(short)
    if ( !arg ) this.unkownError(short)
    debug('found short', short, arg)
    return arg.loadArgv(argv)
  }

  processLong( long, argv ){
    let arg = this.lookupLong(long)
    if ( !arg ) this.unkownError(long)
    debug('found long', long, arg)
    return arg.loadArgv(argv)
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

  processArgv( argv ){
    debug('processArgv', argv)

    this.normaliseArgv(argv)

    let short_re = /^-([^-].*)/
    let long_re = /^--(.*)/
    let m
    while ( argv.length > 0 ) {
      let arg = argv.shift()

      if ( arg[0] !== '-' ) {
        debug('Positional "%s"', arg)
        this.processPositional(arg)
      }
      else if (( m = arg.match(short_re) )) {
        // Short
        let short_arg = m[1]
        debug('Short "%s"', short_arg, arg, argv[0])
        let slurped = this.processShort(short_arg, argv)
        argv = argv.slice(slurped)
      }
      else if (( m = arg.match(long_re) )) {
        // Long
        let long_arg = m[1]
        debug('Long "%s"', long_arg, arg, argv.slice(0,2))
        let slurped = this.processLong(long_arg, argv)
        argv = argv.slice(slurped)
      }
      else {
        throw new LargsError('Unknown argument processing error', arg, argv)
      }
    }

    for (var key in this.config) {
      let arg = this.config[key]
      if ( arg.isRequired() && arg._value === undefined )
        throw new ArgumentError(`The "${arg.required_arg}" argument is required`)
    }
    return this.config

  }

  // Clean me up
  go( process_argv = process.argv ){
    debug('Go processing argv', process_argv)
    this.binary = process_argv[0]
    this.script = process_argv[1]
    this.processArgv(process_argv.slice(2))
    return this.toOptions()
  }

  toOptions(){
    return this.toJSON().options
  }

  toJSON(){
    let o = {
      config: {},
      options: {},
      positional: []
    }
    for (let key in this.config) {
      o.config[key] = this.config[key].toJSON()
    }
    for (let key in this.config) {
      o.options[key] = this.config[key].getValue()
    }
    for (let arg of this.config_positional) {
      o.positional.push(arg._value)
    }
    return o
  }

}

module.exports = { Largs, Arg, ArgumentError }

