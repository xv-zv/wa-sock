const {
   makeWASocket,
   DisconnectReason: DR,
   useMultiFileAuthState,
   Browsers,
   makeCacheableSignalKeyStore,
   delay
} = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs-extra');
const Events = require('./listners.js')
const Ctx = require('./context.js')

class Socket {
   #args
   #limit = 0
   constructor(args) {
      this.#args = args
      this.ev = new Events()
   }
   
   start = async () => {
      const logger = P({ level: 'silent' })
      const {
         state: { creds, keys },
         saveCreds
      } = await useMultiFileAuthState(this.#args.path)
      
      let sock = await makeWASocket({
         logger,
         auth: {
            creds,
            keys: makeCacheableSignalKeyStore(keys, logger)
         },
         browser: Browsers.ubuntu('Chrome')
      })
      this.#initEvents(sock, { saveCreds })
   }
   
   #initEvents = (sock, args) => {
      if (this.#limit >= 5) {
         this.ev.emit('connection', 'closed')
         return sock.ws.close()
      }
      const events = this.#listEvents(sock, args)
      for (const { event, func } of events) {
         sock.ev.on(event, func)
      }
   }
   
   #listEvents = (sock, { saveCreds }) => [
   {
      event: 'messages.upsert',
      func: async ({ type, messages: [ctx] }) => {
         if (type == 'notify') {
            let m = new Ctx(sock, ctx, this.#args)
            if (m.isCommand) {
               this.ev.emitCmd(m.command, m)
            } else {
               this.ev.emit('text', m)
            }
         }
      }
   },
   {
      event: 'creds.update',
      func: saveCreds
   },
   {
      event: 'connection.update',
      func: async ({ connection, ...update }) => {
         const emit = async reazon => {
            await delay(100)
            this.ev.emit('connection', reazon)
         }
         if (this.#args.newLogin && !sock.authState?.creds?.registered && Boolean(update.qr)) {
            const token = await sock.requestPairingCode(this.#args.phone)
            this.ev.off('token', token)
         }
         
         const isClose = connection == 'close'
         const isOpen = connection == 'open'
         const isOnline = Boolean(update.receivedPendingNotifications)
         
         if (isClose) {
            
            const statusCode = update.lastDisconnect?.error?.output?.statusCode
            const isDelete = [DR.connectionReplaced, DR.loggedOut].includes(statusCode)
            
            if (isDelete) {
               fs.removeSync(this.#args.path)
               sock.ws.close()
               return emit('deleted')
            }
            this.#limit += 1
            sock.ev.removeAllListeners()
            emit('restart')
            this.start()
         } else if (isOpen || isOnline) {
            emit(isOnline ? 'online' : 'open')
         }
      }
   }]
   
   command = (cmd, func) => {
      if (this.ev.commands[cmd]) return this
      this.ev.command(cmd, func)
   }
}

module.exports = { Socket }