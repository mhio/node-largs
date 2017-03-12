const { ExtendedError } = require('@deployable/errors')
class ArgumentError extends Error {}
class LargsError extends ExtendedError {}
module.exports = { ArgumentError, LargsError }
