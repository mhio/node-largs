# [largs](https://github.com/deployable/node-largs)

## Light weight command line args parser

Simple command line argument configuration and parsing with minimal dependencies.

The API has a similar feel to Yargs but no where near as extensive.

Requires Node 6+

## Install

    npm install largs --save

    yarn add largs

## Usage

### Options

```javascript

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

console.log(args) // => { options: {}, positional: [], config: {} }
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
   { first:
      { name: 'first',
        short: 'f',
        long: 'firstthing',
        description: undefined,
        help: undefined,
        group: '' },
     second:
      { name: 'second',
        short: 's',
        long: 'two',
        description: undefined,
        help: undefined,
        group: '' } } }
```

## API


## About

largs is released under the MIT license.

Copyright 2016 Matt Hoyle - code at deployable.co

https://github.com/deployable/node-largs

