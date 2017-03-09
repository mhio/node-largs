/* global expect */
const { Arg } = require('../lib/arg')


describe('Unit::largs', function(){

  describe('Arg', function(){

    describe('class instance', function(){

      let arg = null

      beforeEach('setup arg instance', function(){
        arg = new Arg('id')
      })

      it('should create a new instance', function(){
        expect( arg ).to.be.ok
      })

      it('should have the `name` id', function(){
        expect( arg._name ).to.equal( 'id' )
      })

      it('should set the short arg string to `c`', function(){
        arg.short('c')
        expect( arg._short ).to.equal( 'c' )
      })

      it('should set the short arg string to `car`', function(){
        arg.long('car')
        expect( arg._long ).to.equal( 'car' )
      })

      it('should set the arg description to `bar`', function(){
        arg.description('bar')
        expect( arg._description ).to.equal( 'bar' )
      })

      it('should set the arg help to `dar`', function(){
        arg.help('dar')
        expect( arg._help ).to.equal( 'dar' )
      })

      it('should have the `name` id', function(){
        arg.short('c').long('car').description('bar')
        let o = {
          name: 'id',
          long: 'car',
          short: 'c',
          description: 'bar',
          help: undefined
        }
        expect( arg.toJSON() ).to.eql( o )
      })
    })


    describe('types', function(){

      let arg = null

      beforeEach('setup arg instance', function(){
        arg = new Arg('id')
      })

      describe('badtype', function(){
        it('should load a flag from argv', function(){
          let fn = ()=> arg.type('badtype').loadArgv(['-fw'])
          expect( fn ).to.throw(/Unknown arg type "badtype" for "id"/)
        })
        xit('wat?', function(){
          let fn = ()=> arg.type('badtype').loadArgv(['-fw'])
          expect( fn ).to.throw(/Unknown arg type "badtype" for "id"/)
        })
      })
      describe('boolean', function(){
        it('should default a bool to false', function(){
          arg.type('boolean')
          expect( arg._value ).to.equal( false )
        })
        it('should convert any value to a bool', function(){
          arg.type('boolean').value(5)
          expect( arg._value ).to.equal( true )
        })
        it('should convert string "false" to a bool', function(){
          arg.type('boolean').value('false')
          expect( arg._value ).to.equal( false )
        })
        it('should convert string "false" to a bool', function(){
          arg.type('boolean').value('False')
          expect( arg._value ).to.equal( false )
        })
        it('should load a flag from argv', function(){
          arg.type('boolean').loadArgv(['-fw'])
          expect( arg._value ).to.equal( true )
        })
      })

      describe('string', function(){
        it('should set a string value', function(){
          arg.type('string').value('15')
          expect( arg._value ).to.equal('15')
        })
        it('should convert a number to string', function(){
          arg.type('string').value(15)
          expect( arg._value ).to.equal('15')
        })
        it('should load a string from argv', function(){
          arg.type('string').loadArgv(['whatever'])
          expect( arg._value ).to.equal( 'whatever' )
        })
      })

      describe('number', function(){
        it('should set a number value', function(){
          arg.type('number').value(5.5)
          expect( arg._value ).to.equal( 5.5 )
        })
        it('should convert a string number value', function(){
          arg.type('number').value('5.5')
          expect( arg._value ).to.equal( 5.5 )
        })
        it('should fail to set a string', function(){
          let fn = ()=> arg.type('number').value('test')
          expect( fn ).to.throw(/ must be a number /)
        })
        it('should load a number from argv', function(){
          arg.type('number').loadArgv(['5'])
          expect( arg._value ).to.equal( 5 )
        })
      })

      describe('integer', function(){
        it('should set an integer value', function(){
          arg.type('integer').value(5)
          expect( arg._value ).to.equal( 5 )
        })
        it('should set an string integer value', function(){
          arg.type('integer').value('5')
          expect( arg._value ).to.equal( 5 )
        })
        it('should fail to set a string', function(){
          let fn = ()=> arg.type('integer').value('test')
          expect( fn ).to.throw(/ must be an integer/)
        })
        it('should load an integer from argv', function(){
          arg.type('integer').loadArgv(['6','7','8'])
          expect( arg._value ).to.equal( 6 )
        })
      })

      describe('enum', function(){
        it('should set allow a value in the enum', function(){
          arg.type('enum', [ 1, 2, 'test'] ).value(2)
          expect( arg._value ).to.equal( 2 )
        })
        it('should set allow a value in the enum', function(){
          arg.type('enum', [ 1, 2, 'test'] ).value('test')
          expect( arg._value ).to.equal( 'test' )
        })
        it('should disallow a value not in the enum', function(){
          let fn = ()=> arg.type('enum', [ 1, 2, 'test'] ).value(4)
          expect( fn ).to.throw( /must be one of:/ )
        })

        it('should load a flag from argv', function(){
          arg
            .type('enum', ['whatever','two'])
            .loadArgv(['whatever', 'three'])
          expect( arg._value ).to.equal( 'whatever' )
        })
      })
    })

  })
})
