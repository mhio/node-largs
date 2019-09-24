/* global expect */
const debug = require('debug')('mhio:test:largs:integration:largs')
const { CliCode } = require('@mhio/test-cli')
const { Largs } = require('../../lib/largs')


function genArgs(...args){
  return ['/bin/node','largs.js'].concat(...args)
}


describe('Integration::largs::cli', function(){

  let largs = null

  // CliCode allows you to capture and test cli things without
  // launching a full external node process.
  // cc is required so the stdout/stderr can be put back in place.
  let cc = null

  beforeEach(function(){
    largs = new Largs('integration:largs')
  })

  afterEach(function(){
    largs.reset()
    if (cc.tornDown) cc.tornDown()
  })

  it('should default the label to the script name', function(){
    largs = new Largs()
    let fn = ()=> largs.go(genArgs())
    cc = CliCode.create(fn)
    return cc.run(fn).then(()=> {
      expect( largs._label ).to.equal( 'largs.js' )
    })
  })

  it('should default the label to the script name', async function(){
    largs = new Largs()
    let fn = ()=> largs.go(genArgs())
    cc = CliCode.create(fn)
    await cc.run(fn)
    expect( largs._label ).to.equal( 'largs.js' )
  })

  it('should use the attached handler', function(done){
    largs.handler(()=> done())
    let fn = ()=> largs.go(genArgs())
    return CliCode.run(fn)
  })

  it('should add and display help', function(){
    largs.help()
    let fn = ()=> largs.run(genArgs('-h'))
    cc = CliCode.create(fn)
    return cc.run(fn).then(results =>{
      expect(results.stdout, 'stdout').to.include('  -h   --help          - This help')
      expect(results.stderr, 'stderr').to.eql([])
      expect(results.exit_code, 'exit code').to.equal(0)
    })
  })

  it('should dump help when a required arg is missing', function(){
    largs.help().arg('a').required().description('aa')
    let fn = ()=> largs.run(genArgs())
    cc = CliCode.create(fn)
    return cc.run(fn).then(results =>{
      expect(results.stderr, 'stderr')
            .to.eql(['Error: Missing required arguments', ' "-a" is required'])

      expect(results.stdout, 'stdout').to.have.length(6)

      expect(results.stdout[3], 'stdout')
            .to.equal('  -a                   - aa')

      expect(results.stdout[4], 'stdout')
            .to.equal('  -h   --help          - This help')

      expect(results.exit, 'exited').to.be.true
      expect(results.exit_code, 'exit code').to.equal(1)
    })
  })

  it('should report all missing args', function(){
    largs.arg('a').required().description('aa')
    largs.arg('b').required().description('bb')
    let fn = ()=> largs.run(genArgs())
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
    largs.version(55)
    let fn = ()=> largs.run(genArgs('-v'))
    cc = CliCode.create(fn)
    return cc.run(fn).then(results =>{
      expect(results.stdout[0], 'stdout').to.match(/55/)
      expect(results.stderr, 'stderr').to.eql([])
      expect(results.exit_code, 'exit code').to.equal(0)
    })
  })

  it('should add version to help header', function(){
    largs.version(56)
    largs.help()
    let fn = ()=> largs.run(genArgs('-h'))
    cc = CliCode.create(fn)
    return cc.run(fn).then(results =>{
      expect(results.stdout, 'stdout').to.include('integration:largs 56')
      expect(results.stderr, 'stderr').to.eql([])
    })
  })

  it('should error help when a positional is required', function(){
    largs.positional().type('string').required()
    let fn = ()=> largs.run(genArgs())
    cc = CliCode.create(fn)
    return cc.run(fn).then(results =>{
      expect(results.stdout, 'stdout').to.eql([])
      expect(results.stderr, 'stderr').to.eql(['Error: 1 argument is required'])
      expect(results.exit, 'exited').to.be.true
      expect(results.exit_code, 'exit code').to.equal(1)
    })
  })

  it('should error help when many positional is required', function(){
    largs.positional().type('string').required()
    largs.positional().type('integer').required()
    let fn = ()=> largs.run(genArgs())
    cc = CliCode.create(fn)
    return cc.run(fn).then(results =>{
      expect(results.stdout, 'stdout').to.eql([])
      expect(results.stderr, 'stderr').to.eql(['Error: 2 arguments are required'])
      expect(results.exit, 'exited').to.be.true
      expect(results.exit_code, 'exit code').to.equal(1)
    })
  })

  it('should require a required long and short flag', function(){
    largs.arg('garry').short('g').required()
    let fn = ()=> largs.run(['node','js'])
    cc = CliCode.create(fn)
    return cc.run(fn).then(results =>{
      expect(results.stderr, 'stderr')
        .to.eql(['Error: Missing required arguments', ' "--garry/-g" is required'])
    })
  })

  it('should require a required long and short flag with different name', function(){
    largs.arg('gazza').long('garry').short('g').required()
    let fn = ()=> largs.run(['node','js'])
    cc = CliCode.create(fn)
    return cc.run(fn).then(results =>{
      expect(results.stderr, 'stderr')
        .to.eql(['Error: Missing required arguments', ' "--garry/-g" is required'])
    })
  })

  it('should require a required long flag', function(){
    largs.arg('barry').required()
    let fn = ()=> largs.run(['node','js'])
    cc = CliCode.create(fn)
    return cc.run(fn).then(results =>{
      expect(results.stderr, 'stderr')
        .to.eql(['Error: Missing required arguments',' "--barry" is required'])
    })
  })

  it('should require a required short flag', function(){
    largs.arg('b').required()
    let fn = ()=> largs.run(['node','js'])
    cc = CliCode.create(fn)
    return cc.run(fn).then(results =>{
      expect(results.stderr, 'stderr')
        .to.eql(['Error: Missing required arguments',' "-b" is required'])
    })
  })

})
