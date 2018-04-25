const Node = require('../src/Node')

const firstNode = new Node({ port: 4000 })
const nodes = [firstNode]
const seedHosts = ['localhost:4000']

for (let n = 1; n <= 15; n += 1) {
  const node = new Node({ seedHosts })
  node.on('hello', () => console.log(`[${node.port}] hello received`))
  node.on('person', ({ id, name, data, peer, hops }) => {
    console.log(`[${node.port}]`, id, name, data, hops, peer.port)
  })
  nodes.push(node)
}

setTimeout(() => {
  nodes[3].broadcast('hello')
}, 2000)

setTimeout(() => {
  nodes[11].broadcast('person', { name: 'nakamoto' })
}, 10000)

setTimeout(() => {
  console.log('---')
  nodes.forEach(n => {
    console.log(n.port, n.peers.map(p => p.port).sort())
  })
}, 25000)
