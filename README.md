# p2p-broadcast

Distributed P2P discovery and event broadcasting

## Install

```
npm install p2p-broadcast
```

## Usage

```js
import Node from 'p2p-broadcast'

const seedHosts = ['localhost:6000']

const a = new Node({ port: 6000 })
const b = new Node({ port: 6001, seedHosts })
const c = new Node({ port: 6002, seedHosts })

a.on('beep', onBeep)
b.on('beep', onBeep)
c.on('beep', onBeep)

a.broadcast('beep', { hello: 'world' })

function onBeep(event) {
  // event.name
  // event.payload
  // event.peer
  // event.hops
  // event.id
}
```
