const Events = require('events')
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

class Socket extends Events {
   #args
   #limit
   constructor(args) {
      super()
      this.#args = args
      this.#limit = 0
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
      this.initEvents(sock, { saveCreds })
   }
   
   initEvents = (sock, args) => {
      if (this.#limit >= 5) {
         this.emit('connection', 'closed')
         return
      } else if (this.#limit > 1) {
         sock.ev.removeAllListeners()
         this.removeAllListeners()
      }
      const events = this.listEvents(sock, args)
      for (const { event, func } of events) {
         sock.ev.on(event, func)
      }
   }
   
   listEvents = (sock, { saveCreds }) => [
   {
      event: 'messages.upsert',
      func: async (messagesCtx) => {
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
            this.emit('connection', reazon)
         }
         if (this.#args.newLogin && !sock.authState?.creds?.registered && Boolean(update.qr)) {
            const token = await sock.requestPairingCode(this.#args.phone)
            this.emit('onli_token', token)
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
            emit('restart')
            this.start()
         } else if (isOpen || isOnline) {
            emit(isOnline ? 'online' : 'open')
         }
      }
   }]
}