/* global expect */
const debug = require('debug')('dply:test:replacer:integration:largs')
const { CliCode } = require('@deployable/test-cli')
const { Largs } = require('../lib/largs')


function genArgs(...args){
  return ['/bin/node','largs.js'].concat(...args)
}


describe('Integration::largs', function(){

  describe('running commands', function(){

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
      let fn = ()=> l.go(genArgs('-h'))
      cc = CliCode.create(fn)
      return cc.run(fn).then(results =>{
        expect(results.stdout, 'stdout').to.include('  -h   --help          - This help\n')
        expect(results.stderr, 'stderr').to.eql([])
        expect(results.exit_code, 'exit code').to.equal(0)
      })
    })

    it('should run help when a required arg is missing', function(){
      l.help().arg('a').required().description('aa')
      let fn = ()=> l.go(genArgs())
      cc = CliCode.create(fn)
      return cc.run(fn).then(results =>{
        expect(results.stdout, 'stdout').to.have.length(5)

        expect(results.stdout[3], 'stdout')
              .to.equal('  -a                   - aa\n')

        expect(results.stdout[4], 'stdout')
              .to.equal('  -h   --help          - This help\n')

        expect(results.stderr, 'stderr')
              .to.eql(['Error: The "-a" argument is required\n'])

        expect(results.exit, 'exited').to.be.true
        expect(results.exit_code, 'exit code').to.equal(1)
      })
    })

    it('should report all missing args', function(){
      l.arg('a').required().description('aa')
      l.arg('b').required().description('bb')
      let fn = ()=> l.go(genArgs())
      cc = CliCode.create(fn)
      return cc.run(fn).then(results =>{
        expect(results.stdout, 'stdout').to.have.length(0)
        expect(results.stderr, 'stderr').to.eql([
          'Error: The "-a" argument is required\n',
          'Error: The "-b" argument is required\n'
        ])
        expect(results.exit_code, 'exit code').to.equal(1)
      })
    })

    it('should add and display verison', function(){
      l.version(55)
      let fn = ()=> l.go(genArgs('-v'))
      cc = CliCode.create(fn)
      return cc.run(fn).then(results =>{
        expect(results.stdout, 'stdout').to.eql(['55\n'])
        expect(results.stderr, 'stderr').to.eql([])
        expect(results.exit_code, 'exit code').to.equal(0)
      })
    })

    it('should error help when a positional is required', function(){
      l.positional().type('string').required()
      let fn = ()=> l.go(genArgs())
      cc = CliCode.create(fn)
      return cc.run(fn).then(results =>{
        expect(results.stdout, 'stdout').to.eql([])
        expect(results.stderr, 'stderr').to.eql(['Error: 1 argument is required\n'])
        expect(results.exit, 'exited').to.be.true
        expect(results.exit_code, 'exit code').to.equal(1)
      })
    })

  })

})
