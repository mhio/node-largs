/* global expect */
const { Largs } = require('../lib/largs')


describe('Unit::largs', function(){


  describe('Largs', function(){

    let l = null

    beforeEach('setup the largs instance', function(){
      l = new Largs('id')
      l.arg('require')
      l.arg('ui')
      l.arg('bail').short('b').type('flag')
      l.arg('watch').short('w').type('flag')
    })

    it('should import the Largs class', function(){
      expect( l.label ).to.equal( 'id' )
    })

    it('should process args argv', function(){
      let argv = [ '/bin/node',
        '/bin/_mocha',
        '--require',
        './test/fixture/mocha-setup.js',
        '--ui',
        'bdd',
        '-bw'
      ]
      expect( l.go(argv) ).to.be.ok
    })

    it('should process a positional argv', function(){
      let argv = [ '/bin/node', 'script.js',
        'first',
        'second',
        'third'
      ]
      expect( l.go(argv) ).to.be.ok
      expect( l.config_positional[0]._value ).to.equal( 'first' )
      expect( l.config_positional[1]._value ).to.equal( 'second' )
      expect( l.config_positional[2]._value ).to.equal( 'third' )
    })

    it('should process combined argv', function(){
      let argv = [ '/bin/node',
        '/bin/_mocha',
        '--require',
        './a.js',
        './b.js'
      ]
      expect( l.go(argv) ).to.be.ok
      expect( l.config.require._value ).to.equal( './a.js' )
      expect( l.config_positional[0]._value ).to.equal( './b.js' )
    })

    it('should export json', function(){
      let argv = [ 'node', 't.js', '--require', 'a', '-b', '-w']
      l.go(argv)
      expect( l.toJSON().options ).eql({
        bail: true,
        watch: true,
        require: 'a',
        ui: undefined
      })
    })

    it('should allow combined flags when last needs a parameter', function(){
      l = new Largs('id')
      l.arg('b')
      l.arg('w').type('flag')
      l.go(['node','js','-wb', 'last'])
      expect( l.toJSON().options ).eql({
        b: 'last',
        w: true
      })
    })

    it('shouldn\'t allow combined flags that need a parameter', function(){
      l = new Largs('id')
      l.arg('b')
      l.arg('w').type('flag')
      let fn = ()=> l.go(['node','js','-bw', 'last'])
      expect( fn ).to.throw(/Combined arguments must be flags/)
    })

    it('shouldn\'t allow combined flags that need a parameter', function(){
      l = new Largs('id')
      l.arg('b')
      l.arg('w').type('flag')
      let fn = ()=> l.go(['node','js','-bw'])
      expect( fn ).to.throw(/option requires a paramater/)
    })

  })

})
