/* global expect */
const { ArgumentException, ArgumentsException, LargsException } = require('../../lib/exceptions')


describe('unit::largs::exceptions', function(){

  describe('ArgumentException', function(){

    it('should import the ArgumentException class', function(){
      expect( ArgumentException ).to.be.ok
    })

  })

  describe('ArgumentsException', function(){

    it('should import the ArgumentException class', function(){
      expect( ArgumentsException ).to.be.ok
    })

    it('should import the ArgumentException class', function(){
      expect( new ArgumentsException('') ).to.be.ok
    })

    it('should build an error from an array of message', function(){
      let err = ArgumentsException.build('wat?',['wat!','wat?!'])
      expect( ()=> {throw err} ).to.throw('wat?\n wat!\n wat?!')
    })

    it('should build an error from an array of message', function(){
      let err = ArgumentsException.build('wat')
      expect( ()=> {throw err} ).to.throw(/^wat$/)
    })

  })

  describe('LargsException', function(){

    it('should import the LargsException class', function(){
      expect( LargsException ).to.be.ok
    })

  })

})
