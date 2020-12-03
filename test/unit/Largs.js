/* global expect */
const debug = require('debug')('mhio:test:replacer:unit:largs')
const { Largs } = require('../../lib/largs')


describe('Unit::largs::Largs', function(){

  describe('Module', function(){
   
    it('should import a Largs', function(){
      expect(require('../../')).be.an.instanceOf(Largs)
    })
    it('should import a Largs.Largs', function(){
      expect(require('../../').Largs).be.eql(Largs)
    })
    it('should import a default', function(){
      expect(require('../../').default).be.an.instanceOf(Largs)
    })
    it('should import a largs instance', function(){
      expect(require('../../').largs).be.an.instanceOf(Largs)
    })
    it('should import a VERSION', function(){
      expect(require('../../').VERSION).to.match(/\d+\.\d+\.\d+/)
    })

  })

  describe('Class', function(){

    let l = null

    beforeEach(function(){
      l = new Largs('class')
    })

    describe('normalise', function(){

      it('should not normalise a simple arg', function(){
        l.normaliseArgv(['-b'])
        expect( l.argv ).to.eql([ '-b' ])
      })
      it('should normalise 3 combined args into 3 seperate args -bwa', function(){
        l.normaliseArgv(['-bwa'])
        expect( l.argv ).to.eql([ '-b', '-w', '-a' ])
      })
      it('should normalise combined args and leave others -bw test', function(){
        l.normaliseArgv(['-bw', 'test'])
        expect( l.argv ).to.eql([ '-b', '-w', 'test'])
      })
      it('should not normalise multiple simple args -b -w', function(){
        l.normaliseArgv(['-b', '-w'])
        expect( l.argv ).to.eql([ '-b', '-w' ])
      })
      it('should not normalise long args that are short --b', function(){
        l.normaliseArgv(['--b', '--w'])
        expect( l.argv ).to.eql([ '--b', '--w' ])
      })
      it('should not normalise long args that look combined --ba', function(){
        l.normaliseArgv(['--ba', '--wa'])
        expect( l.argv ).to.eql([ '--ba', '--wa' ])
      })

      // not sure if this is right
      it('should normalise args', function(){
        expect( ()=> l.normaliseArgv(['---']) ).to.throw('Invalid argument')
      })

      it('should allow - as an option', function(){
        l.normaliseArgv(['-f', '-'])
        expect( l.argv ).to.eql([ '-f', '-'])
      })
      it('should allow -- as an option', function(){
        l.normaliseArgv(['-f', '--', 'next'])
        expect( l.argv ).to.eql([ '-f', '--', 'next' ])
      })

    })

    it('should lookup a short option by character', function(){
      l.option('b')
      let b = l.lookupShort('b')
      expect( b, 'name' ).to.have.property('_name').and.equal('b')
      expect( b, 'short' ).to.have.property('_short').and.equal('b')
    })

    it('should lookup a long option by name', function(){
      l.option('ba')
      let b = l.lookupLong('ba')
      expect( b, 'name' ).to.have.property('_name').and.equal('ba')
      expect( b, 'long' ).to.have.property('_long').and.equal('ba')
    })

    it('should lookup a long option by long name', function(){
      l.option('ba').long('bab')
      let b = l.lookupLong('bab')
      expect( b, 'name' ).to.have.property('_name').and.equal('ba')
      expect( b, 'long' ).to.have.property('_long').and.equal('bab')
    })

    it('should fail to lookup a long option by original name', function(){
      l.option('ba').long('bab')
      let b = l.lookupLong('ba')
      expect( b, 'name' ).to.eql( false )
    })

    it('.lookupGroup single', function(){
      l.option('ba').group('first')
      let o = l.lookupGroup('first')
      expect( o ).to.have.keys('ba')
    })

    it('.lookupGroup multiple', function(){
      l.option('ba').group('second')
      l.option('cd').group('second')
      let o = l.lookupGroup('second')
      expect( o ).to.have.keys('ba', 'cd')
    })

    it('should list all the short args', function(){
      l.option('a')
      l.option('b')
      expect(l.listShortArgs()).to.eql(['a', 'b'])
    })

    it('should list all the short args without long', function(){
      l.option('a')
      l.option('b')
      l.option('bbb')
      expect(l.listShortArgs()).to.eql(['a', 'b'])
    })

    it('should list all the long args', function(){
      l.option('bbb')
      l.option('ccc')
      expect(l.listLongArgs()).to.eql(['bbb', 'ccc'])
    })

    it('should list all the long args without short', function(){
      l.option('b')
      l.option('bbb')
      l.option('ccc')
      expect(l.listLongArgs()).to.eql(['bbb', 'ccc'])
    })

  })


  describe('Largs', function(){

    let l = null

    beforeEach('setup the largs instance', function(){
      l = new Largs('id')
      l.arg('require')
      l.arg('ui')
      l.arg('bail').short('b').type('flag')
      l.arg('watch').short('w').type('flag')
    })

    it('should set a label from constructor', function(){
      expect( l._label ).to.equal( 'id' )
    })

    it('should change the label', function(){
      l.label('whatever')
      expect( l._label ).to.equal( 'whatever' )
    })

    it('should set a handler function', function(){
      let fn = ()=> 'test'
      l.handler(fn)
      expect( l._handler ).to.equal( fn )
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
      expect( l.getPositional() ).to.eql( ['first', 'second', 'third'] )
    })

    it('should process combined argv', function(){
      let argv = [ '/bin/node',
        '/bin/_mocha',
        '--require',
        './a.js',
        './b.js'
      ]
      expect( l.go(argv) ).to.be.ok
      expect( l.config_options.require._value ).to.equal( './a.js' )
      expect( l.config_positional[0]._value ).to.equal( './b.js' )
    })

    it('should error on an unknown flag "worry"', function(){
      l = new Largs('id')
      l.arg('barry')
      let fn = ()=> l.go(['node','js','--worry'])
      expect( fn ).throw(/The "worry" argument is unknown/)
    })

    it('should error on an unknown flag "-w"', function(){
      l = new Largs('id')
      l.arg('b').required()
      let fn = ()=> l.go(['node','js','-w'])
      expect( fn ).throw(/The "w" argument is unknown/)
    })

    it('should allow combined flags when only the last needs a parameter', function(){
      l = new Largs('id')
      l.arg('w').type('flag')
      l.arg('a').type('flag')
      l.arg('b')
      l.go(['node','js','-wab', 'last'])
      expect( l.toOptionsObject() ).eql({
        b: 'last',
        w: true,
        a: true
      })
    })

    it('shouldn\'t allow combined flags that need a parameters', function(){
      l = new Largs('id')
      l.arg('b')
      l.arg('w').type('flag')
      let fn = ()=> l.go(['node','js','-bw', 'last'])
      expect( fn ).to.throw(/Combined arguments can only be flags/)
    })

    it('shouldn\'t allow combined flags that need a parameter', function(){
      l = new Largs('id')
      l.arg('b')
      l.arg('w').type('flag')
      let fn = ()=> l.go(['node','js','-bw'])
      expect( fn ).to.throw(/Combined arguments can only be flags/)
    })

    it('should process mocha like argv', function(){
      l.arg('b').type('boolean')
      debug('l.config', l.config_options.b)
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

    it('should export json', function(){
      let argv = [ 'node', 't.js', '--require', 'a', '-b', '-w']
      l.go(argv)
      expect( l.getOptions() ).eql({
        bail: true,
        watch: true,
        require: 'a',
        ui: undefined
      })
    })

    it('should add a version option', function(){
      l.version(2)
      expect( l.getOptions() )
        .to.contain.key('version').and.to.be.ok
    })

    it('should add a help option', function(){
      l.help()
      expect( l.getOptions() )
        .to.contain.key('help').and.to.be.ok
    })

    it('should match the same using `options` config', function(){

      let m = new Largs('id')
      m.options({
        require: {},
        ui: {},
        bail: { short: 'b', type: 'flag' },
        watch: { short: 'w', type: 'flag' },
      })
      expect( m.getOptions() ).to.eql( l.getOptions() )
      expect( m.getConfig() ).to.eql( l.getConfig() )
      expect( m.getPositional() ).to.eql( l.getPositional() )
    })

  })

  describe('Largs commands', function(){

    it('should support a command', function(){
      let m = new Largs('id')
      m.command('test')
      expect( m.getOptions() ).to.eql( { test: {} } )
    })

    it('should support a command with options', function(){
      let m = new Largs('id')
      m.command('test').args({ yep: {} })
      expect( m.getOptions() ).to.eql( { test: { yep: undefined } } )
    })

    it('should support a command with .args settings', function(){
      let m = new Largs('id')
      m.command('test').args({ yep: { type: Boolean, default: true } })
      expect( m.getOptions() ).to.eql( { test: { yep: true } } )
    })

    it('should support a command from object', function(){
      const opts = Largs.go({
        command_1: {
          what: {
            type: Boolean,
          },
        },
        options1: {
          help: 'helpt',
        },
      }, { process_argv: ['node', 'go.js', '--options1', 'o1', '1', '--what' ] })
      expect( opts ).to.eql({
        1: {
          what: true,
        },
        options1: 'o1',
      })
    })

  })

})
