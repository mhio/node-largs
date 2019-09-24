const { Exception } = require('@mhio/exception')

class LargsException extends Exception {}

class ArgumentException extends Exception {}

class ArgumentsException extends Exception {
  static build( message, errors = [] ){
    if ( errors.length > 0 ) message += `\n ${errors.join('\n ')}`
    return new this(message, { errors: errors, simple: message })
  }
  constructor( msg, options = {} ){
    super(msg, options)
    this.errors = options.errors || []
  }
}

module.exports = { ArgumentException, LargsException, ArgumentsException }
