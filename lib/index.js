// # Largs

const { Arg } = require('./arg')
const { Largs } = require('./largs')
const { ArgumentError, LargsError } = require('./errors')
const VERSION = require('../package.json').version

module.exports = new Largs()
module.exports.Arg = Arg
module.exports.ArgumentError = ArgumentError
module.exports.LargsError = LargsError
module.exports.VERSION = VERSION
