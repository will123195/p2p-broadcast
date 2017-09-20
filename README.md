# p2p-network

## Usage

```js
import Node from 'p2p-network'

const node = new Node({
  port: 6005,
  seedHosts: ['127.0.0.1:6004']
})

node.on('myCommand', (peer, message) => {
  const host = peer.host
  console.log(`Received 'myCommand' message from ${host}:`, message)
  // relay the message to all peers except the host that sent the message
  node.relay(message, { excludeHosts: [host] })
})

node.joinNetwork()

const message = {
  command: 'myCommand',
  payload: null
}
node.broadcast(message)
```
