/* global expect */
const { ArgumentError, ArgumentsError, LargsError } = require('../lib/errors')


describe('Unit::largs::errors', function(){


  describe('ArgumentError', function(){

    it('should import the ArgumentError class', function(){
      expect( ArgumentError ).to.be.ok
    })

  })

  describe('ArgumentsError', function(){

    it('should import the ArgumentError class', function(){
      expect( ArgumentsError ).to.be.ok
    })

    it('should import the ArgumentError class', function(){
      expect( new ArgumentsError('') ).to.be.ok
    })

    it('should build an error from an array of message', function(){
      let err = ArgumentsError.build('wat?',['wat!','wat?!'])
      expect( ()=> {throw err} ).to.throw('wat?\n wat!\n wat?!')
    })

    it('should build an error from an array of message', function(){
      let err = ArgumentsError.build('wat')
      expect( ()=> {throw err} ).to.throw(/^wat$/)
    })

  })

  describe('LargsError', function(){

    it('should import the LargsError class', function(){
      expect( LargsError ).to.be.ok
    })

  })

})
