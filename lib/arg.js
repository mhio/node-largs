const debug = require('debug')('dply:replacer:arg')
const { ArgumentError, LargsError } = require('./errors')


class Arg {

  // static create(config){
  //   let arg = new Arg(config.name)
  //   arg.short(config.short)
  //   arg.long(config.long)
  //   arg.description(config.description)
  //   arg.help(config.help)
  //   return arg
  // }

  constructor( name ){

    // Store the name
    this._name = name

    // Positional?
    if ( typeof name === 'number') {
      this.positional()
    }
    else if ( name.length === 1 ) {
      // Default the long or short to the name
      this._short = name
    }
    else {
      this._long = name
    }

    // Default type of string
    this._type = 'string'

    // Default type of string
    this._required = false
  }

  get required_arg(){
    if ( this._long && this._short ) return `--${this._long}/-${this._short}`
    if ( this._long ) return `--${this._long}`
    if ( this._short ) return `-${this._short}`
  }

  get used_arg(){
    if ( this._provided_arg ) {
      let prefix = ( this._provided_arg.length === 1 ) ? '-' : '--'
      return `${prefix}${this._provided_arg}`
    }
    return `${this._name}`
  }

  loadArgv( argv, arg ){
    debug('Arg loading "%s", %s', this._name, argv )
    this._provided_arg = arg
    switch(this._type){

      case 'boolean':
        this.value(true)
        return 0

      case 'number':
      case 'enum':
      case 'string':
      case 'integer':
        if ( argv.length === 0 ) throw new ArgumentError(`The "${(this.used_arg)}" option requires a paramater`)
        this.value(argv.slice(0,1)[0])
        return 1

      default:
        throw new LargsError('Wat?')
    }
  }

  value( val ){
    debug('Setting arg "%s" to "%s"', this._name, val, typeof val, this._type)
    switch(this._type){

      case 'boolean':
        if (val.toString().toLowerCase() === 'false') val = false
        this._value = Boolean(val)
        break

      case 'string':
        this._value = val.toString()
        break

      case 'number':
        if ( isNaN(Number(val)) )
          throw new ArgumentError(`Arg "${(this.used_arg)}" was "${this._value}" but must be a number [0-9]+.[0-9]+`)
        this._value = Number(val)
        break

      case 'integer':
        if ( ! val.toString().match(/^[0-9]+/) )
          throw new ArgumentError(`Arg "${this.used_arg}" was "${this._value}" but must be an integer [0-9]+`)
        this._value = Number(val)
        break

      case 'enum':
        if ( !this._values.includes(val) ) {
          let msg = `Arg "${this.used_arg}" was "${val}" but must be one of: ${this._values.join(', ')}"`
          throw new ArgumentError(msg)
        }
        this._value = val
        break
    }
  }

  getValue(){
    return this._value
  }

  // This is a positional arg, no `-` or `--`
  positional(){
    this._positional = true
  }

  short( str ){
    this._short = str
    return this
  }

  long( str ){
    this._long = str
    return this
  }


  isFlag(){
    return (this._type === 'boolean')
  }

  type( str, val ){
    switch(str){

      case 'boolean':
      case 'bool':
      case 'flag':
        this._type = 'boolean'
        this.default(false)
        this._slurp = 0
        break

      case 'string':
      case 'str':
        this._type = 'string'
        this._slurp = 1
        break

      case 'number':
      case 'num':
        this._type = 'number'
        this._slurp = 1
        break

      case 'integer':
      case 'int':
        this._type = 'integer'
        this._slurp = 1
        break

      case 'enum':
        this._type = 'enum'
        this._values = val
        this._slurp = 1
        break

      default:
        throw new LargsError(`Unknown arg type "${str}" for "${this._name}"`)
    }
    return this
  }

  // slurp( val ){
  //   this._slurp = val
  //   return this
  // }

  validate(){
    // Do all the validation at once instead of random error handling
    return false
  }

  // Is this a required argument?
  isRequired(){
    return this._required
  }

  // Set required
  required(){
    this._required = true
    return this
  }

  // Set group
  group( val ){
    this._group = val
    return this
  }

  // Set a default
  default( val ){
    this._default = val
    this._value = val
    return this
  }

  // Set the description
  description( str ){
    this._description = str
    return this
  }

  // Set the help string
  help( str ){
    this._help = str
    return this
  }

  // Set the example string
  example( str ){
    this._example = str
    return this
  }

  handler(fn){
    this._handler = fn
    return this
  }

  toJSON(){
    return {
      name: this._name,
      short: this._short,
      long: this._long,
      description: this._description,
      help: this._help,
      group: this._group
    }
  }
}

module.exports = { Arg, ArgumentError }

