# [largs](https://github.com/mhio/node-largs)

## Light weight command line args parser

Simple command line argument configuration and parsing with minimal dependencies.

The API has a similar feel to [Yargs](http://yargs.js.org/) but largs has a limited feature set. 

Requires Node 6+

## Install

    npm install largs --save

    yarn add largs

## Usage

Create an `.option` or `.positional` and then `.run()`

A `.command` can have `.option` and `.positional` too

### Options

Shortcut Options config setup

```javascript
//import Largs from 'largs'
const { Largs } = require('largs')

const args = Largs.run({
  first: { short: 'f', required: true },
  second: { short: 's', long: 'two', type: 'integer', default: 1 },
  command_bork: {
    onlyhere: { type: String },
  }
})
console.log(args.bork.onlyhere) // => 'chef'
```

For functional Setup, you can import an instance
```javascript
//import { largs } from 'largs'
const { largs } = require('largs')

largs.option('firstthing')
   .short('f')
   .required()

const cmd_bork = largs.command('bork')
cmd_bork.option('onlyforbork').type('string)

largs.option('otherthing')
   .short('s')
   .long('two')
   .type('integer')
   .default(1)

largs.positional('one')
   .type('enum', ['this'])
   .required()

const args = largs.run() // returns object representation of opts. `opts.largs`

console.log(args) // => { firstthing: "val", otherthing: "val", positional: [ 'one' ] }
```


```
→ node app.js --two 22222 this
Error: Missing required arguments
 "--firstthing/-f" is required

→ node app.js -f one --two 22222
Error: 1 argument is required

→ node app.js -f one --two 22222 asdf
Error: Arg "1" was "asdf" but must be one of: this"

→ node app.js -f one --two 22222 this
{ options: { first: 'one', second: 22222 },
  positional: [ 'this' ],
  config:
   { firstthing:
      { name: 'firstthing',
        short: 'f',
        long: 'firstthing',
        description: undefined,
        help: undefined,
        group: '' },
     otherthing:
      { name: 'otherthing',
        short: 's',
        long: 'two',
        description: undefined,
        help: undefined,
        group: '' } } }
```



## API


## About

largs is released under the MIT license.

Copyright 2019 mhio

https://github.com/mhio/node-largs

