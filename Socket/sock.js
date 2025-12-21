import makeWASocket, {
   useMultiFileAuthState,
   fetchLatestBaileysVersion,
   DisconnectReason,
   isRealMessage,
   isJidGroup
} from 'baileys';
import pino from 'pino';
import ws from 'ws';
import fs from 'fs/promises';
import { DEFAULT_OPC } from '../Defaults/index.js';
import { Events, methods, toArray } from '../Utils/index.js';
import fetchMessage from './message.js';

export let OPC_CONFIG = {}
export default class Socket extends Events {
   #opc
   #sock
   constructor(opc = {}) {
      super()
      OPC_CONFIG = this.#opc = {
         ...DEFAULT_OPC,
         ...opc,
         prefix: toArray(opc.prefix, DEFAULT_OPC.prefix),
         owner: toArray(opc.owner, DEFAULT_OPC.owner),
         ignore: {
            ...DEFAULT_OPC.ignore,
            ...(opc.ignore || {}),
            ids: toArray(opc.ignore?.ids)
         }
      }
   }
   
   get isOnline() {
      return this.#sock?.ws?.socket?._readyState == ws.OPEN
   }
   
   start = async () => {
      
      if (this.isOnline) return
      
      const { version } = await fetchLatestBaileysVersion()
      const {
         state: auth,
         saveCreds
      } = await useMultiFileAuthState(this.#opc.path)
      
      this.#sock = await makeWASocket({
         logger: pino({ level: 'silent' }),
         auth,
         version,
         shouldIgnoreJid: id => {
            const { groups, chats, status } = this.#opc.ignore
            return (isJidGroup(id) ? groups : chats) || isJidBroadcast(id) ? status : false
         }
      })
      
      Object.assign(this, methods(this.#sock))
      
      const events = this.#listEvents(saveCreds)
      for (const { event, func } of events) {
         this.#sock.ev.on(event, func)
      }
      return {
         isOnline: this.isOnline
      }
   }
   
   online = false
   close = () => {
      if (!this.isOnline) return
      this.#sock.ev.removeAllListeners()
      this.#sock.ws.close()
   }
   
   #listEvents = saveCreds => [
   {
      event: 'messages.upsert',
      func: async ({ type, messages }) => {
         if (type == 'notify') {
            for (const msg of messages) {
               const { remoteJid, id, fromMe } = msg.key
               if (this.#opc.ignore.ids.includes(remoteJid) && !fromMe) return
               if (!isRealMessage(msg, id)) return
               
               const m = await fetchMessage(this, msg)
               const params = [m, msg]
               
               if (m.isCmd) this.emitCmd(m.cmd, ...params)
               if (m.isMedia) this.emit('media', ...params)
               if (!m.isCmd && !m.isMedia) this.emit('text', ...params)
            }
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
               await fs.rm(this.#opc.path, {
                  force: true,
                  recursive: true
               })
               emit('delete')
               return
            }
            
            emit('restart')
            setTimeout(this.start, 4500)
            
         } else if (isOnline || isOpen) {
            if (isOnline) this.online = true
            emit(isOnline ? 'online' : 'open')
         }
      }
   },
   {
      event: 'creds.update',
      func: saveCreds
   },
   {
      event: 'contacts.upsert',
      func: console.log
   }]
}