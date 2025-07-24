const {
   getContentType,
   jidNormalizedUser,
} = require('@whiskeysockets/baileys')

class Ctx {
   #sock
   #message
   #globalArgs
   constructor(sock, message, globalArgs) {
      this.#sock = sock
      this.#message = message
      this.#globalArgs = globalArgs
      return this.ctx
   }
   
   get bot() {
      let user = this.#sock.user
      return {
         id: jidNormalizedUser(user.id),
         lid: jidNormalizedUser(user.lid),
         name: user.name || 'annonymous'
      }
   }
   
   ctx = (message = this.#message, quoted) => {
      const m = {}
      const {
         remoteJid,
         fromMe,
         participant
      } = message.key
      
      if (!quoted) {
         
         const { prefix, path } = this.#globalArgs
         
         m.bot = {
            prefix: Array.isArray(prefix) ? prefix : [prefix || '/'],
            path,
            ...this.bot
         }
         m.from = remoteJid
      }
      
      m.sender = participant || remoteJid
      
      const message = this.#message?.message
      const isSms = Boolean(message) && !message.protocolMessage
      
      if (isSms) {
         m.type = getContentType(message)
         const msg = message[m.type]
         const body = (m.type === 'conversation') ? msg : (m.type === 'extendedTextMessage') ? msg.text : (m.type === 'imageMessage') ? msg.caption : (m.type === 'videoMessage') ? msg.caption : null
         
         if (body) {
            
            let argsAll
            
            if (!quoted) {
               
               const matchCmd = body.slice(1)?.match(/[a-zA-Z]{1,10} /)?.shift()
               
               m.isCommand = m.bot.prefix.some(i => body.startsWith(i)) && Boolean(matchCmd)
               
               const [command, ...args] = m.isCommand ? body.slice(matchCmd.length).trim().split(/ +/) : body.trim().split(/ +/)
               const _prefix = body.split('')[0]
               
               if (m.isCommand) {
                  
                  m.command = command.trim().toLowerCase()
                  m.prefix = _prefix
                  argsAll = args
               } else {
                  argsAll = [_prefix, command, ...args]
               }
               m.text = argsAll.join(' ')
            }
         }
         
         const isCtx = Boolean(msg?.contextInfo)
         
         if (isCtx) {
            
            const ctx = mgs.contextInfo
            m.expiration = ctx.expiration
            m.mentions = ctx.mentionedJid
            
            m.isQuoted = Boolean(ctx.quotedMessage)
            
            if (m.isQuoted) {
               
               const quoted = {
                  key: {
                     remoteJid: m.from,
                     fromMe: ctx.participant === m.bot.id,
                     id: ctx.stanzaId,
                     participant: ctx.participant
                  },
                  message: ctx.quotedMessage
               }
               m.quoted = this.ctx(quoted, true)
            }
         }
      }
      
      send = (text) => {
         return this.#sock.sendMessage(m.from, {
            text,
            contextInfo: {
               expiration: m.expiration || 0
            }
         }, { quoted: message })
      }
      
      return m
   }
}

module.exports = Ctx