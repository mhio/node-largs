const { ExtendedError } = require('@deployable/errors')

class LargsError extends ExtendedError {}

class ArgumentError extends ExtendedError {}

class ArgumentsError extends ExtendedError {
  static build( message, errors = [] ){
    if ( errors.length > 0 ) message += `\n ${errors.join('\n ')}`
    return new this(message, { errors: errors, simple: message })
  }
  constructor( msg, options = {} ){
    super(msg, options)
    this.errors = options.errors || []
  }
}

module.exports = { ArgumentError, LargsError, ArgumentsError }
