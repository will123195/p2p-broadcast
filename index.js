const net = require('net')
const JsonSocket = require('./JSONSocket')
const shuffle = require('./shuffle')

const noOp = function () {}

class P2PNode {

  constructor(options) {
    this.ip = '127.0.0.1'
    this.port = options.port || 6000
    this.seedHosts = options.seedHosts
    this.peers = {}
    // TODO: purge broadcastIds after 30s
    this.broadcastIds = {}
    this.messageHandlers = {}
  }

  on(command, handler) {
    this.messageHandlers[command] = handler
  }

  joinNetwork(cb) {
    this.startServer()
    const host = this.seedHosts && this.seedHosts[0]
    if (host) {
      this.connectToPeer({ host }, cb)
    }
  }

  startServer() {
    this.server = net.createServer()
    this.server.listen(this.port, this.ip)
    this.server.on('connection', rawSocket => {
      const peer = new JsonSocket(rawSocket)
      peer.remoteAddress = rawSocket.remoteAddress
      peer.on('message', message => this.handleMessage(peer, message))
    })
  }

  broadcast(message, options) {
    const id = Math.floor(Math.random() * 100000)
    const msg = Object.assign({ id }, message)
    this.relay(msg, options)
  }

  relay(message, options = {}) {
    if (this.broadcastIds[message.id]) {
      return
    }
    const excludeHosts = options.excludeHosts || []
    this.broadcastIds[message.id] = new Date()
    const hosts = Object.keys(this.peers).filter(h => !excludeHosts.includes(h))
    const randomHosts = shuffle(hosts).filter((h, i) => !(i % 2))
    randomHosts.forEach(host => {
      this.peers[host].sendMessage(message)
    })
  }

  registerPeer({ peer, host }) {
    peer.host = host
    this.peers[host] = peer
  }

  unregisterPeer(host) {
    delete this.peers[host]
  }

  handleMessage(peer, message) {
    if (this.broadcastIds[message.id]) {
      return
    }
    const command = message.command
    switch (command) {
      case '@handshake':
        if (!peer.remoteAddress || !message.payload.port) {
          return
        }
        const host = `${peer.remoteAddress}:${message.payload.port}`
        this.registerPeer({ peer, host })
        const msg = {
          command: '@addPeer',
          payload: { host }
        }
        this.broadcast(msg, { excludeHosts: [host] })
        break
      case '@addPeer':
        const connectionSuccessful = this.connectToPeer({ host: message.payload.host })
        if (connectionSuccessful) {
          this.relay(message)
        }
        break
    }
    if (!this.messageHandlers[command]) {
      return
    }
    this.messageHandlers[command](peer, message)
  }

  connectToPeer({ host }, cb = noOp) {
    const alreadyConnected = this.peers[host]
    if (alreadyConnected) return false
    const peer = new JsonSocket(new net.Socket())

    const hostname = host.split(':')[0]
    const port = host.split(':')[1]

    peer.connect(port, hostname, () => {
      this.registerPeer({ peer, host })
      this.broadcast({
        command: '@handshake',
        payload: { port: this.port }
      })
      cb()
    })

    peer.on('message', message => this.handleMessage(peer, message))

    peer.on('close', function () {
      this.unregisterPeer(host)
      console.log(this.port, 'Connection closed')
    })
    return true
  }


}

module.exports = P2PNode
