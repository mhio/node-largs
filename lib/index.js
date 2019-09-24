// # Largs

const { Arg } = require('./arg')
const { Largs } = require('./largs')
const { ArgumentException, ArgumentsException, LargsException } = require('./exceptions')
const VERSION = require('../package.json').version

module.exports = new Largs()
module.exports.Arg = Arg
module.exports.ArgumentException = ArgumentException
module.exports.ArgumentsException = ArgumentsException
module.exports.LargsException = LargsException
module.exports.VERSION = VERSION
