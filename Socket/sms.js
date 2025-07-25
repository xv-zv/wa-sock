const {
   getContentType,
   jidNormalizedUser
} = require('@whiskeysockets/baileys')
const F = require('./Utils/funcs.js')

class Ctx {
   #sock
   #message
   #globalArgs
   
   constructor(sock, message, globalArgs) {
      this.#sock = sock
      this.#message = message
      this.#globalArgs = globalArgs
      return this.extract
   }
   
   get bot() {
      const user = this.#sock.user
      const args = this.#globalArgs
      return {
         id: jidNormalizedUser(user.id),
         lid: jidNormalizedUser(user.lid),
         name: user.name || 'annonymous',
         prefix: F.setArray(args.prefix || '/')
      }
   }
   
   extract = () => {
      const key = this.#message.key
      const message = this.#message.message
      const { body, quoted } = this.getBody(message)
      
      const m = {
         from: this.getFrom(key),
         body: {
            id: key.id,
            ...body
         }
      }
      
      if (quoted) {
         m.quote = this.getQuote(quoted)
      }
      
      return m
   }
   
   getFrom = (key) => {
      const id = key.remoteJid
      const isGroup = id.endsWith('@g.us')
      return {
         id,
         sender: key.participant || id,
         isGroup
      }
   }
   
   getBody = (message, quoted = false) => {
      const m = {}
      if (!message || message.protocolMessage) return { body: m }
      
      const type = getContentType(message)
      const msg = message[type]
      const body =
         type === 'conversation' ? msg :
         type === 'extendedTextMessage' ? msg.text : ['imageMessage', 'videoMessage'].includes(type) ? msg.caption :
         ''
      
      m.type = type
      m.text = body
      
      if (!quoted && body) {
         const isCmd = this.bot.prefix.some(i => body.startsWith(i))
         m.isCmd = isCmd
         if (isCmd) {
            const [cmd, ...args] = body.slice(1).trim().split(/\s+/)
            m.cmd = cmd
            m.text = args.join(' ')
         }
      }
      
      const ctx = msg.contextInfo
      if (ctx) {
         m.exp = ctx.expiration
         m.mentions = ctx.mentionedJid
         if (ctx.quotedMessage) quoted = ctx.quotedMessage
      }
      
      return { body: m, quoted }
   }
   
   getQuote = (m) => ({
      from: { sender: m.participant },
      body: this.getBody(m, true).body
   })
}

module.exports = Ctx