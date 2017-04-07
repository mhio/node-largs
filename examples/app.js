const largs = require('largs')

largs.option('first')
   .short('f')
   .long('firstthing')
   .required()

largs.option('second')
   .short('s')
   .long('two')
   .type('integer')
   .default(1)

largs.positional('one')
   .type('enum', ['this'])
   .required()

const args = largs.run() // returns `largs.conf`

console.log(args) // => { config: {}, options: {}, positional: [] }

