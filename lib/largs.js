const debug = require('debug')('dply:replacer:largs')
const { ArgumentError } = require('./errors')
const { Arg } = require('./arg')


class Largs {

  constructor( label ){
    this.label = label
    this.reset()
  }

  reset(){
    this.config = {}
    this.config_positional = []
    this.processed_positional = 0
  }

  arg( str ){
    return this.config[str] = new Arg(str)
  }

  // Define mix/max positional args
  positional(){
    let next = this.config_positional.length + 1
    return this.config_positional.push(new Arg(next))
  }

  lookupShort( char ){
    for (var key in this.config) {
      if ( this.config[key]._short === char ) return this.config[key]
    }
    return false
  }

  processShort( char, argv ){
    let arg = this.lookupShort(char)
    if ( !arg ) throw new ArgumentError(`No argument ${char}`)
    return arg.loadArgv(argv)
  }

  lookupLong( str ){
    for (var key in this.config) {
      if ( this.config[key]._long === str ) return this.config[key]
    }
    return false
  }

  processLong( str, argv ){
    let arg = this.lookupLong(str)
    if ( !arg ) throw new ArgumentError(`No argument ${str}`)
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

  go( process_argv = process.argv ){
    debug('Go on processing argv', process_argv)
    let argv = process_argv.slice(2)

    while ( argv.length > 0 ) {
      let arg = argv.shift()
      debug('arg', arg)
      let m = null

      let short_re = /^-([^-].*)/
      let long_re = /^--(.*)/

      if (( m = arg.match(short_re) )) {
        // Short
        let head = m[1].slice(0, -1)
        let last_char = m[1].slice(-1)
        for ( let char of head ) {
          debug('Short joined "%s"', char, arg, argv.slice(0,2))
          let slurped = this.processShort(char, argv)
          if ( slurped !== 0 )
            throw new ArgumentError(`Combined arguments must be flags "${arg}"`)
        }
        debug('Short "%s"', last_char, arg, argv[0])
        let slurped = this.processShort(last_char, argv)
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
        debug('Positional "%s"', arg)
        this.processPositional(arg)
      }
    }
    return this.config
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
      o.options[key] = this.config[key]._value
    }
    for (let arg in this.positional_config) {
      o.positional.push(arg._value)
    }
    return o
  }

}

module.exports = { Largs, Arg, ArgumentError }

