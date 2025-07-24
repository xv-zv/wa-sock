const {
   getContentType,
   jidNormalizedUser,
} = require('@whiskeysockets/baileys')

class Ctx {
   #sock
   #message
   constructor(sock, message, globalArgs) {
      this.#sock = sock
      this.#message = message
      return this.getCtx()
   }
   
   get bot() {
      let user = this.#sock.user
      return {
         id: jidNormalizedUser(user.id),
         lid: jidNormalizedUser(user.lid),
         name: user.name || 'annonymous'
      }
   }
   
   get extractCtx(m = {}) {
      let {
         remoteJid,
         fromMe,
         participant
      } = this.#message.key
      
      m.bot = this.bot
      m.from = remoteJid
      m.sender = participant || remoteJid
      
      let message = this.#message?.message
      let isSms = Boolean(message) && !message.protocolMessage
      
      if (isSms) {
         m.type = getContentType(message)
         let msg = message[m.type]
         m.body = (m.type === 'conversation') ? msg : (m.type === 'extendedTextMessage') ? msg.text : ''
         if (m.body) {
            
            m.isCommand = (globalArgs.prefix || ['/']).some(i => m.body.startWith(i))
            let [command, ...args] = m.isCommand ? m.body.slice(1).trim().split(/ +/) : m.body.trim().split(/ +/)
            
            if (m.isCommand) {
               
               m.command = command.trim().toLowerCase()
               
            }
         }
      }
      return m
   }
}

module.exports = Ctx