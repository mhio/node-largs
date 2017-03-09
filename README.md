# [largs](https://github.com/deployable/node-largs)

## Title

Lighter command line args parser

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

