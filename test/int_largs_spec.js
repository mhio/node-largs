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
        expect(results.stdout).to.include('  -h   --help          - This help\n')
        expect(results.stderr).to.eql([])
        expect(results.exit_code).to.equal(0)
      })
    })

    it('should run help with nothing else is provided', function(){
      l.help()
      let fn = ()=> l.go(genArgs())
      cc = CliCode.create(fn)
      return cc.run(fn).then(results =>{
        expect(results.stdout).to.include('  -h   --help          - This help\n')
        expect(results.stderr).to.eql([])
        expect(results.exit_code).to.equal(0)
      })
    })

    it('should run help when a required arg is missing', function(){
      l.help().arg('a').required().description('aa')
      let fn = ()=> l.go(genArgs())
      cc = CliCode.create(fn)
      return cc.run(fn).then(results =>{
        expect(results.stdout).to.have.length(5)
        expect(results.stdout[3]).to.equal('  -a                   - aa\n')
        expect(results.stdout[4]).to.equal('  -h   --help          - This help\n')
        expect(results.stderr).to.eql(['The "-a" argument is required\n'])
        expect(results.exit_code).to.equal(0)
      })
    })

    it('should add and display verison', function(){
      l.version(55)
      let fn = ()=> l.go(genArgs('-v'))
      cc = CliCode.create(fn)
      return cc.run(fn).then(results =>{
        expect(results.stdout).to.eql(['55\n'])
        expect(results.stderr).to.eql([])
        expect(results.exit_code).to.equal(0)
      })
    })

  })

})
