//const largs = require('largs')
const largs = require('../')

largs.help().version('0.2.0').options({
  f: {
    required: true,
    help: 'This is the f description for help',
  },

  second: {
    long: 'two',
    type: 'integer',
    default: 1,
    help: 'Some more help for the two integer',
  },
 
})

const args = largs.run() // returns largs options`

// `node examples/config.js -f one --two 2
// `node examples/config.js --firstthing one --two 2
console.log(args) // => { first: 'one', second: 2 }

