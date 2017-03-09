# [largs](https://github.com/deployable/node-largs)

## Light weight command line args parser 

Simple command line argument configuration and parsing with minimal dependencies.

The API has a similar feel to Yargs but no where near as extensive.

Requires Node 6+

## Install
 
    npm install largs --save

    yarn add largs

## Usage

```javascript

const l = require('largs')
l.option('first')
   .short('f')
   .long('firstthing')
   .required()

l.options('second')
   .short('s')
   .long('two')
   .type('integer')
   .default(1)

l.go()

```

## API


## About

largs is released under the MIT license.

Copyright 2016 Matt Hoyle - code at deployable.co

https://github.com/deployable/node-largs

