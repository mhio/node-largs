const { ExtendedError } = require('@deployable/errors')
class ArgumentError extends ExtendedError {}
class LargsError extends ExtendedError {}
module.exports = { ArgumentError, LargsError }