import makeWASocket, {
   useMultiFileAuthState,
   fetchLatestBaileysVersion,
   DisconnectReason,
   isRealMessage
} from 'baileys';
import pino from 'pino';
import { DEFAULT_OPC_CONFIG } from '../Defaults/index.js';
import { events, methods } from '../Utils/index.js';

export default class Socket {
   #opc = DEFAULT_OPC_CONFIG
   #sock
   constructor(args = {}) {
      this.#opc = {
         ...this.#opc,
         ...opc
      }
   }
   
   get isOnline() {
      return this.#sock?.ws.socket._readyState == 1
   }
   
   start = async () => {
      
      if (this.isOnline) return
      
      const logger = pino({ level: 'silent' })
      const { version } = await fetchLatestBaileysVersion()
      const {
         state: auth,
         saveCreds
      } = await useMultiFileAuthState(this.#opc.path)
      
      this.#sock = await makeWASocket({
         logger,
         auth,
         version
      })
      
      Object.assign(this, events(), methods(this, this.#opc))
      
      const events = this.#listEvents(saveCreds)
      for (const { event, func } of events) {
         this.#sock.ev.on(event, func)
      }
      
   }
   
   close = () => {
      this.#sock.ev.removeAllListeners()
      this.#sock.ws.close()
   }
   
   #listEvents = saveCreds => [
   {
      event: 'messages.upsert',
      func: async ({ type , messages: [message]}) => {
         if(type == 'notify'){
            if(!isRealMessage(message , message.key.id)) return 
            const m = await this.fetchMessage(message)
            const params = [m , message]
            
         }
      }
   },
   {
      event: 'connection.update',
      func: async ({ connection, ...update }) => {
         if (!this.sock?.authState?.creds?.registered && Boolean(update.qr) && Boolean(this.#opc.phone)) {
            const code = await this.fetchCode(this.#opc.phone)
            this.off('code', code)
         }
         
         const isOnline = Boolean(update?.receivedPendingNotifications);
         const isOpen = connection == 'open';
         const emit = reazon => this.emit('status', reazon)
         
         if (connection == 'close') {
            
            const statusCode = update.lastDisconnect.error?.output?.statusCode
            const isDelete = [DisconnectReason.connectionReplaced,
               DisconnectReason.loggedOut,
               DisconnectReason.badSession
            ].includes(statusCode)
            
            this.close()
            
            if (isDelete) {
               fs.removeSync(this.#opc.path)
               emit('delete')
               return
            }
            
            emit('restart')
            setTimeout(this.start, 4500)
            
         } else if (isOnline || isOpen) {
            emit(isOnline ? 'online' : 'open')
         }
         
      }
   },
   {
      event: 'creds.update',
      func: saveCreds
   }]
}