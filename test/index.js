const { Node } = require('../src')
const test = require('tape')
const Promise = require('bluebird')

const maxPeers = 3
const seedHosts = ['127.0.0.1:6001']

async function createNewNode (opts) {
  await Promise.delay(50)
  const node = new Node(Object.assign({ maxPeers }, opts))
  node.on('hello', (event) => {
    // const { name, payload, peer, hops, id } = event
    node.receivedHello = true
  })
  return node
}

let nodes = {}

const validate = message => {
  // throw new Error('invalid message')
}

test('create mesh network', async t => {
  nodes.a = await createNewNode({ port: 6001 })
  nodes.b = await createNewNode({ port: 6002, seedHosts, validate })
  nodes.c = await createNewNode({ port: 6003, seedHosts, validate })
  nodes.d = await createNewNode({ port: 6004, seedHosts, validate })
  nodes.e = await createNewNode({ port: 6005, seedHosts, validate })
  nodes.f = await createNewNode({ port: 6006, seedHosts, validate })
  nodes.g = await createNewNode({ port: 6007, seedHosts, validate })
  nodes.h = await createNewNode({ port: 6008, seedHosts, validate })

  // wait for the nodes to establish mesh network
  setTimeout(() => {
    Object.keys(nodes).forEach(key => {
      const numPeers = Object.keys(nodes[key].peers).length
      t.ok(numPeers, `${key} has ${numPeers} peers`)
    })
    Object.keys(nodes).forEach(key => {
      console.log(`${nodes[key].port} is connected to:`, nodes[key].peers.map(peer => peer.port))
    })
    t.end()
  }, 5000)
})

test('broadcast message', t => {
  const origin = 'a'
  Object.keys(nodes).forEach(key => {
    nodes[key].on('hello', ({ data, peer }) => {
      peer.send('ack', { name: nodes[key].port })
    })
    nodes[key].on('ack', ({ data }) => {
      console.log(`${nodes[key].port} got ack from ${data.name}`)
    })
  })
  nodes[origin].broadcast('hello', {
    random: Math.random()
  })
  // wait for the message to propagate the network
  setTimeout(() => {
    Object.keys(nodes).forEach(key => {
      const node = nodes[key]
      const receivedHello = node.receivedHello
      if (key === origin) return
      // console.log(key, node.port, receivedHello)
      t.ok(receivedHello, `${key}.receivedHello`)
    })
  }, 5000)
})

// e.on('customCommand', (peer, message) => {
//   console.log('customCommand message:', message)
//   e.relay(message)
// })
//
// setTimeout(() => {
//   b.broadcast({ command: 'customCommand' })
// }, 250)
//
