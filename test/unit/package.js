const l = require('../')

describe('Unit::largs', function(){

  describe('Package', function(){
  
    it('should do something with module', function(){
      expect( l ).to.be.ok
    })

    it('should have Arg attached', function(){
      expect( l.Arg ).to.be.ok
    })

    it('should have ArgumentError attached', function(){
      expect( l.ArgumentError ).to.be.ok
    })

    it('should have LargsError attached', function(){
      expect( l.LargsError ).to.be.ok
    })

    it('should have a VERSION attached', function(){
      expect( l.VERSION ).to.be.a('string')
    })

  })

})
