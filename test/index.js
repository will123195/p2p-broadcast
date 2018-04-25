const { Node } = require('../src')
const test = require('tape')
const Promise = require('bluebird')

const maxPeers = 3
const seedHosts = ['127.0.0.1:6001']

function createNewNode (opts) {
  const node = new Node(Object.assign({ maxPeers }, opts))
  node.on('hello', (event) => {
    // const { name, payload, peer, hops, id } = event
    node.receivedHello = true
    console.log('receivedHello!')
  })
  return new Promise((resolve, reject) => {
    node.joinNetwork()
    resolve(node)
  })
}

let nodes

test('create mesh network', t => {
  Promise.props({
    a: createNewNode({ port: 6001 }),
    b: createNewNode({ port: 6002, seedHosts }),
    c: createNewNode({ port: 6003, seedHosts }),
    d: createNewNode({ port: 6004, seedHosts }),
    e: createNewNode({ port: 6005, seedHosts }),
    f: createNewNode({ port: 6006, seedHosts }),
    g: createNewNode({ port: 6007, seedHosts }),
    h: createNewNode({ port: 6008, seedHosts })
  })
  .then(newNodes => {
    nodes = newNodes
    // wait for the nodes to establish mesh network
    setTimeout(() => {
      Object.keys(nodes).forEach(key => {
        const numPeers = Object.keys(nodes[key].peers).length
        t.ok(numPeers, `${key} has ${numPeers} peers`)
      })
      Object.keys(nodes).forEach(key => {
        console.log(key, Object.keys(nodes[key].peers))
      })
      t.end()
    }, 2000)
  })
  .catch(err => t.fail(err))
})

// test('broadcast message', t => {
//   const origin = 'b'
//   nodes[origin].broadcast('hello', {
//     random: Math.random()
//   })
//   // wait for the message to propagate the network
//   setTimeout(() => {
//     Object.keys(nodes).forEach(key => {
//       const node = nodes[key]
//       console.log(key, node.port, node.receivedHello)
//       const receivedHello = node.receivedHello
//       if (key === origin) return
//       t.ok(receivedHello, `${key}.receivedHello`)
//     })
//   }, 100)
// })

// e.on('customCommand', (peer, message) => {
//   console.log('customCommand message:', message)
//   e.relay(message)
// })
//
// setTimeout(() => {
//   b.broadcast({ command: 'customCommand' })
// }, 250)
//
