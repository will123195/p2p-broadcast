const Node = require('..')

let hellosReceived = 0

function createNewNode(opts) {
  const node = new Node(opts)
  node.on('hello', (peer, message) => {
    hellosReceived++
    node.relay(message)
  })
  node.joinNetwork()
  return node
}

const a = createNewNode({ port: 6001 })
const b = createNewNode({ port: 6002, seedHosts: ['127.0.0.1:6001'] })
const c = createNewNode({ port: 6003, seedHosts: ['127.0.0.1:6001'] })
const d = createNewNode({ port: 6004, seedHosts: ['127.0.0.1:6002'] })
const e = createNewNode({ port: 6005, seedHosts: ['127.0.0.1:6004'] })

e.on('customCommand', (peer, message) => {
  console.log('customCommand message:', message)
  e.relay(message)
})

setTimeout(() => {
  b.broadcast({
    command: 'hello',
    payload: {
      random: Math.random()
    }
  })

  b.broadcast({ command: 'customCommand' })
}, 250)

setTimeout(() => {
  console.log('hellosReceived:', hellosReceived)
}, 500)