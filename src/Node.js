const net = require('net')
const EventEmitter = require('events')
const Peer = require('./Peer')
const uuid = require('./uuid')

const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const noOp = () => {}

class Node extends EventEmitter {
  /**
   * Creates a new network Node
   * @param port {Number}
   * @param seedHosts {String[]}
   * @param minPeers {Number}
   * @param maxPeers {Number}
   */
  constructor({
    port,
    seedHosts = [],
    minPeers = 3,
    maxPeers = 10,
    debug
  } = {}) {
    super()
    this.id = uuid()
    this.hostname = 'localhost'
    this.port = port
    this.host = `${this.hostname}:${this.port}`
    this.minPeers = minPeers
    this.maxPeers = maxPeers
    this.peers = []
    this.receivedMessages = {}
    this.seedHosts = seedHosts
    this.debug = debug || noOp
    this.startServer()
    setInterval(() => this.joinNetwork(), 1000)
  }

  createMessage({ command, payload = {}, broadcast = false }) {
    const sender = this.id
    const id = uuid()
    return { id, sender, command, payload, broadcast }
  }

  broadcast(command, payload = {}) {
    this.debug('[p2p] broadcast:', command, payload)
    const message = this.createMessage({ command, payload, broadcast: true })
    this.broadcastMessage(message)
  }

  broadcastMessage(message) {
    const hops = (message.hops || 0) + 1
    const msg = Object.assign({}, message, { hops })
    this.peers.forEach(peer => peer.write(msg))
  }

  /**
   * Create an outgoing connection to a server peer
   * @param hostname {String}
   * @param port {Number}
   */
  connect({ hostname = 'localhost', port }) {
    const host = `${hostname}:${port}`
    const alreadyConnected = this.peers.find(p => (host === `${p.getHostname()}:${p.port}`))
    // TODO: isSelf should consider private ip and public ip
    const isSelf = (host === this.host)
    if (isSelf) return
    if (alreadyConnected) return alreadyConnected.send('hosts?')
    const socket = net.createConnection(port, hostname)
    const peer = new Peer({ socket, node: this })
    peer.host = host
    socket.on('connect', () => peer.send('hosts?'))
    socket.on('end', () => this.removePeer(peer))
    socket.on('timeout', () => console.log(`${this.port} socket timeout`))
    socket.on('drain', () => console.log(`${this.port} socket drain`))
    socket.on('error', error => this.removePeer(peer))
    peer.port = Number(port)
    peer.isOutgoingConnection = true
    this.peers.push(peer)
  }

  removePeer(peer) {
    const index = this.peers.findIndex(p => p.id === peer.id)
    this.peers.splice(index, 1)
    // this.removeSeedHost(peer.host)
  }

  /**
   * Listen for incoming connections from client peers
   */
  startServer() {
    const server = net.createServer()
    server.listen(this.port)
    server.on('listening', () => {
      this.port = server.address().port
    })
    server.on('connection', socket => {
      const peer = new Peer({ socket, node: this })
      peer.isIncomingConnection = true
      if (this.peers.length >= this.maxPeers) {
        peer.send('hosts!', this.seedHosts)
        socket.ending = true
        return socket.end()
      }
      peer.send('port?')
      peer.send('hosts?')
      this.peers.push(peer)
    })
    server.on('close', () => console.log(`${this.port} server close`))
    server.on('error', error => console.log(`${this.port} server error:`, error))
    this.server = server
  }

  addSeedHosts(hosts) {
    this.seedHosts = [...new Set([...this.seedHosts, ...hosts])]
  }

  removeSeedHost(host) {
    if (!host) return
    const index = this.seedHosts.findIndex(seedHost => seedHost === host)
    this.seedHosts.splice(index, 1)
  }

  joinNetwork() {
    if (!this.seedHosts.length) return
    if (this.peers.length >= this.minPeers) return
    if (!this.port) return
    const rand = random(0, this.seedHosts.length - 1)
    const host = this.seedHosts[rand]
    const index = host.lastIndexOf(':')
    const hostname = host.slice(0, index)
    const port = host.slice(index + 1)
    this.connect({ hostname, port })
  }
}

module.exports = Node
