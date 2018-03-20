//const largs = require('largs')
const largs = require('../')

largs.options({
  first: {
    short: 'f',
    long: 'firstthing',
    required: true,
  },

  second: {
    long: 'two',
    type: 'integer',
    default: 1,
  },

})

const args = largs.run() // returns largs options`

// `node examples/config.js -f one --two 2
// `node examples/config.js --firstthing one --two 2
console.log(args) // => { first: 'one', second: 2 }

