/* global expect */
const debug = require('debug')('dply:test:replacer:integration:largs')
const { CliCode } = require('@deployable/test-cli')
const { Largs } = require('../lib/largs')


function genArgs(...args){
  return ['/bin/node','largs.js'].concat(...args)
}


describe('Integration::largs', function(){

  describe('Running command', function(){

    let l = null
    let cc = null

    beforeEach(function(){
      l = new Largs('integration:largs')
    })

    afterEach(function(){
      l.reset()
      cc.tornDown()
    })

    it('should add and display help', function(){
      l.help()
      let fn = ()=> l.run(genArgs('-h'))
      cc = CliCode.create(fn)
      return cc.run(fn).then(results =>{
        expect(results.stdout, 'stdout').to.include('  -h   --help          - This help')
        expect(results.stderr, 'stderr').to.eql([])
        expect(results.exit_code, 'exit code').to.equal(0)
      })
    })

    it('should dump help when a required arg is missing', function(){
      l.help().arg('a').required().description('aa')
      let fn = ()=> l.run(genArgs())
      cc = CliCode.create(fn)
      return cc.run(fn).then(results =>{
        expect(results.stderr, 'stderr')
              .to.eql(['Error: Missing required arguments', ' "-a" is required'])

        expect(results.stdout, 'stdout').to.have.length(5)

        expect(results.stdout[3], 'stdout')
              .to.equal('  -a                   - aa')

        expect(results.stdout[4], 'stdout')
              .to.equal('  -h   --help          - This help')

        expect(results.exit, 'exited').to.be.true
        expect(results.exit_code, 'exit code').to.equal(1)
      })
    })

    it('should report all missing args', function(){
      l.arg('a').required().description('aa')
      l.arg('b').required().description('bb')
      let fn = ()=> l.run(genArgs())
      cc = CliCode.create(fn)
      return cc.run(fn).then(results =>{
        expect(results.stdout, 'stdout').to.have.length(0)
        expect(results.stderr, 'stderr').to.eql([
          'Error: Missing required arguments',
          ' "-a" is required',
          ' "-b" is required'
        ])
        expect(results.exit_code, 'exit code').to.equal(1)
      })
    })

    it('should add and display verison', function(){
      l.version(55)
      let fn = ()=> l.run(genArgs('-v'))
      cc = CliCode.create(fn)
      return cc.run(fn).then(results =>{
        expect(results.stdout, 'stdout').to.eql(['55'])
        expect(results.stderr, 'stderr').to.eql([])
        expect(results.exit_code, 'exit code').to.equal(0)
      })
    })

    it('should add version to help header', function(){
      l.version(56)
      l.help()
      let fn = ()=> l.run(genArgs('-h'))
      cc = CliCode.create(fn)
      return cc.run(fn).then(results =>{
        expect(results.stdout, 'stdout').to.include('integration:largs 56')
        expect(results.stderr, 'stderr').to.eql([])
      })
    })

    it('should error help when a positional is required', function(){
      l.positional().type('string').required()
      let fn = ()=> l.run(genArgs())
      cc = CliCode.create(fn)
      return cc.run(fn).then(results =>{
        expect(results.stdout, 'stdout').to.eql([])
        expect(results.stderr, 'stderr').to.eql(['Error: 1 argument is required'])
        expect(results.exit, 'exited').to.be.true
        expect(results.exit_code, 'exit code').to.equal(1)
      })
    })

    it('should require a required long and short flag', function(){
      l.arg('garry').short('g').required()
      let fn = ()=> l.run(['node','js'])
      cc = CliCode.create(fn)
      return cc.run(fn).then(results =>{
        expect(results.stderr, 'stderr')
          .to.eql(['Error: Missing required arguments', ' "--garry/-g" is required'])
      })
    })

    it('should require a required long and short flag with different name', function(){
      l.arg('gazza').long('garry').short('g').required()
      let fn = ()=> l.run(['node','js'])
      cc = CliCode.create(fn)
      return cc.run(fn).then(results =>{
        expect(results.stderr, 'stderr')
          .to.eql(['Error: Missing required arguments', ' "--garry/-g" is required'])
      })
    })

    it('should require a required long flag', function(){
      l.arg('barry').required()
      let fn = ()=> l.run(['node','js'])
      cc = CliCode.create(fn)
      return cc.run(fn).then(results =>{
        expect(results.stderr, 'stderr')
          .to.eql(['Error: Missing required arguments',' "--barry" is required'])
      })
    })

    it('should require a required short flag', function(){
      l.arg('b').required()
      let fn = ()=> l.run(['node','js'])
      cc = CliCode.create(fn)
      return cc.run(fn).then(results =>{
        expect(results.stderr, 'stderr')
          .to.eql(['Error: Missing required arguments',' "-b" is required'])
      })
    })

  })

})
