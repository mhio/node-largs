/* global expect */
const { ArgumentError, LargsError } = require('../lib/errors')


describe('Unit::largs::errors', function(){


  describe('ArgumentError', function(){

    it('should import the ArgumentError class', function(){
      expect( ArgumentError ).to.be.ok
    })

  })


  describe('LargsError', function(){

    it('should import the LargsError class', function(){
      expect( LargsError ).to.be.ok
    })

  })

})
