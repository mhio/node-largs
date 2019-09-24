/* global expect */
const largs = require('../../')

describe('Unit::largs::package', function(){

  it('should do something with module', function(){
    expect( largs ).to.be.ok
  })

  it('should have Arg attached', function(){
    expect( largs.Arg ).to.be.ok
  })

  it('should have ArgumentException attached', function(){
    expect( largs.ArgumentException ).to.be.ok
  })

  it('should have ArgumentsException attached', function(){
    expect( largs.ArgumentsException ).to.be.ok
  })

  it('should have LargsException attached', function(){
    expect( largs.LargsException ).to.be.ok
  })

  it('should have a VERSION attached', function(){
    expect( largs.VERSION ).to.be.a('string')
  })

})
