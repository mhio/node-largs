/* global expect */
const largs = require('../../')

describe('Unit::largs::package', function(){

  it('should do something with module', function(){
    expect( largs ).to.be.ok
  })

  it('should have Arg attached', function(){
    expect( largs.Arg ).to.be.ok
  })

  it('should have ArgumentError attached', function(){
    expect( largs.ArgumentError ).to.be.ok
  })

  it('should have LargsError attached', function(){
    expect( largs.LargsError ).to.be.ok
  })

  it('should have a VERSION attached', function(){
    expect( largs.VERSION ).to.be.a('string')
  })

})
