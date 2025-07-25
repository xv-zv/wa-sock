const {
   jidNormalizedUser
} = require('@whiskeysockets/baileys');

const F = require('../Utils/utils.js');
const H = require('./utils.js');
const S = require('./funcs.js');

class Ctx {
   #sock
   #globalArgs
   
   constructor(sock, globalArgs) {
      this.#sock = sock
      this.#globalArgs = globalArgs
      return this.build()
   }
   
   bot() {
      const user = this.#sock.user
      const args = this.#globalArgs
      
      return {
         id: jidNormalizedUser(user?.id),
         lid: jidNormalizedUser(user.lid),
         name: user.name || 'Vy - Team',
         prefix: F.setArray(args.prefix || '/')
      }
   }
   
   build() {
      const bot = this.bot()
      return (msg) => {
         const from = H.getFrom(msg.key)
         const { body, media, quoted } = H.getBody(msg.message, { prefixes: bot.prefix })
         
         const sendMessage = (c, o = {}) => {
            return this.#sock.sendMessage(o.id || from.id, {
               ...c,
               viewOnce: Boolean(o.once),
               contextInfo: {
                  expiration: body.exp || 0,
                  mentionedJid: o.mentions || []
               }
            }, { quoted: Boolean(o.quote) ? msg : Boolean(o.quoted) ? o.quoted : null })
         }
         let m = {
            bot,
            from: { ...from, name: msg.pushName },
            body: { id: msg.key.id, ...body }
         }
         
         if(msg.broadcast) m.from.bc = msg.broadcast
         
         if (Boolean(media)) m.media = H.getMedia(media)
         if (Boolean(quoted)) m.quote = H.getQuote(quoted)
         m = {
            ...m,
            send: (text, o = {}) => sendMessage({ text }, o),
            sendImage: (i, o = {}) => S.sendImage(sendMessage, i, o),
            sendVideo: (v, o = {}) => S.sendVideo(sendMessage, v, o),
            sendAudio: (a, o) => S.sendAudio(sendMessage, a, o),
            sendFile: (f, o) => S.sendFile(sendMessage, f, o),
            sendPoll: (p, o) => S.sendPoll(sendMessage, p, o)
         }
         return m
      }
   }
}
module.exports = Ctx