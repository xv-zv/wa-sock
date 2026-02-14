import {
   normalizedConfig,
   EventsEmiter,
   storeCache,
   groupCache,
   changeGroupCache
} from '../Utils/index.js';
import makeWASocket, {
   useMultiFileAuthState,
   isRealMessage,
   jidNormalizedUser,
   isJidGroup,
   DisconnectReason
} from 'baileys';
import { rm } from 'node:fs/promises';
import pino from 'pino';
import { Message } from './Message/message.js';

export class Socket extends EventsEmiter {
   #opc = null
   #sock = null
   constructor(opc = {}) {
      super()
      this.#opc = normalizedConfig(opc)
   }
   
   get isOnline() {
      return this.#sock?.ws?.socket?._readyState == 1
   }
   
   start = async () => {
      
      if (this.isOnline) return
      
      const {
         state: auth,
         saveCreds
      } = await useMultiFileAuthState(this.#opc.path)
      
      this.#sock = await makeWASocket({
         logger: pino({ level: 'silent' }),
         auth,
      })
      
      const events = this.#listEvents(saveCreds, auth)
      for (const { event, func } of events) {
         this.#sock.ev.on(event, func)
      }
   }
   
   close = () => {
      if (!this.isOnline) return
      this.#sock.ev.removeAllListeners()
      this.#sock.ws.close()
      this.#sock = null
   }
   
   #listEvents = (saveCreds, auth) => [
   {
      event: 'messages.upsert',
      func: async ({ type, messages }) => {
         if (type !== 'notify') return
         
         for (const msg of messages) {
            
            if (!isRealMessage(msg)) continue
            const id = msg.key.remoteJid
            const isGroup = isJidGroup(id)
            if (isGroup) await this.groupMetadata(id)
            
            const options = {
               prefix: this.#opc.prefix,
               owners: this.#opc.owners,
               user_id: this.user.id
            }
            const m = new Message(msg, options)
            
            const data = {
               id,
               expiration: m.expiration,
               message: msg
            }
            storeCache.run(data, () => {
               if (m.isCommand) this.emitCmd(this.hasCmd(m.command) ? m.command : 'default', m)
               if (m.isMedia) this.emit('media', m)
               if (!m.isCommand && !m.isMedia) this.emit('text', m)
            })
         }
      }
   },
   {
      event: 'connection.update',
      func: async ({ connection, ...update }) => {
         const phoneNumber = this.#opc.phone
         if (!auth.creds?.registered && update.qr && phoneNumber) {
            const code = await this.#sock.requestPairingCode(phoneNumber, 'VYSVNXVZ')
            if (code) this.emit('code', code.match(/.{1,4}/g).join('-'))
         }
         
         const isOnline = !!update?.receivedPendingNotifications;
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
               await rm(this.#opc.path, {
                  force: true,
                  recursive: true
               })
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
   
   get user() {
      const user = this.#sock.user || {}
      return {
         id: jidNormalizedUser(user.lid || user.id),
         pn: jidNormalizedUser(user.id || ''),
         name: user.name
      }
   }
   sendMessage(jid, content, opc = {}) {
      const data = storeCache.getStore() || {}
      const id = jid || opc.id || data.id
      const quoted = typeof opc.quote == 'boolean' && opc.quote ? data.message : opc.quoted || null
      if (!id) return
      
      return this.#sock.sendMessage(id, {
         ...content,
         contextInfo: {
            mentionedJid: opc.mentions,
            expiration: data.expiration || 0
         }
      }, { quoted })
   }
   
   reply(text, opc = {}) {
      return this.sendMessage(null, { text }, opc)
   }
   react(text, opc = {}) {
      const data = storeCache.getStore() || {}
      if (!data.message?.key && !opc.key) return
      return this.#sock.sendMessage(data.id, {
         react: {
            text,
            key: opc.key || data.message.key
         }
      })
   }
   async groupMetadata(id) {
      if (!id || !isJidGroup(id)) return
      
      if (groupCache.has(id)) return groupCache.get(id)
      
      const group = await this.#sock.groupMetadata(id)
      
      const data = {
         id,
         name: group.subject,
         owner: group.owner,
         size: group.size,
         ephemeral: group.ephemeralExpiration,
         creation: group.creation,
         open: !group.announce,
         users: group.participants.map(i => ({
            id: i.id,
            admin: !!i.admin
         })),
         desc: group.desc
      }
      
      groupCache.set(id, data)
      return data
   }
}