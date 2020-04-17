const split = require('split')
const uuid = require('./uuid')

class Peer {
  constructor({ socket, node }) {
    this.id = uuid()
    const splitter = split(JSON.parse, null, { trailing: false })
    socket.pipe(splitter).on('data', data => this.receive(data))
    this.socket = socket
    this.node = node
    this.receivedMessages = {}
  }

  receive(message) {
    if (!message || !message.command) {
      throw new Error('Message missing command.')
    }
    const isOriginalSender = message.sender === this.node.id
    const alreadyReceived = this.node.receivedMessages[message.id]
    if (alreadyReceived || isOriginalSender) return
    this.node.receivedMessages[message.id] = true
    const hostname = this.getHostname()

    switch (message.command) {
      case 'port?': return this.send('port!', this.node.port)
      case 'port!': {
        const port = Number(message.payload)
        this.port = port
        return this.node.addSeedHosts([`${hostname}:${port}`])
      }
      case 'hosts?': {
        if (!this.node.seedHosts.length) return
        return this.send('hosts!', this.node.seedHosts)
      }
      case 'hosts!': {
        return this.node.addSeedHosts(message.payload)
      }
      default: 
        Promise.resolve()
        .then(() => this.node.validate(message))
        .then(() => {
          if (message.broadcast) {
            this.node.broadcastMessage(message)
          }
          this.node.debug('[p2p] receive:', message.command, message.payload)
          this.node.emit(message.command, {
            id: message.id,
            name: message.command,
            data: message.payload,
            peer: this,
            hops: message.hops,
            sender: message.sender,
          })
        })
        .catch(() => {})
    }
  }

  send(command, payload = {}, broadcast = false) {
    if (this.socket.ending) return
    const message = this.node.createMessage({ command, payload, broadcast })
    this.write(message)
  }

  write(message) {
    try {
      this.socket.write(`${JSON.stringify(message)}\n`)
    } catch (err) {
      this.node.removePeer(this)
    }
  }

  getHostname() {
    const hostname = this.socket.remoteAddress
    switch (hostname) {
      case '127.0.0.1':
      case '::ffff:127.0.0.1':
        return 'localhost'
      default:
        return hostname
    }
  }
}

module.exports = Peer
