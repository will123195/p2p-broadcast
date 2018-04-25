# p2p-broadcast

Simple P2P message broadcasting

## Install

```
npm install p2p-broadcast
```

## Usage

All options are optional.

```
const node = new Node({
  port: 6000,
  seedHosts: ['example.com:1234'],
  minPeers = 3,
  maxPeers = 10
})
```

## Example

```js
import Node from 'p2p-broadcast'

const seedHosts = ['localhost:6000']

const a = new Node({ port: 6000 })
const b = new Node({ seedHosts })
const c = new Node({ seedHosts })

const onBeep = n => ({ id, name, data, peer, hops }) => {
  console.log(n, name, data)
}

a.on('beep', onBeep('a'))
b.on('beep', onBeep('b'))
c.on('beep', onBeep('c'))

c.broadcast('beep', { hello: 'world' })

// --- output ---
// a beep { hello: 'world' }
// b beep { hello: 'world' }
```

## Network Topology

New nodes join the network to form a [partial mesh network topology](https://en.wikipedia.org/wiki/Network_topology#Mesh).
