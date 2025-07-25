const {
   getContentType,
   jidNormalizedUser,
   downloadContentFromMessage
} = require('@whiskeysockets/baileys')
const F = require('../Utils/funcs.js')

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
   
   get extract() {
      const key = this.#message.key
      const message = this.#message.message
      const { body, quoted, media } = this.getBody(message)
      
      const m = {
         from: this.getFrom(key),
         body: {
            id: key.id,
            ...body
         }
      }
      if (media) m.media = this.getMedia(media)
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
      let media
      if (!message || message.protocolMessage) return { body: m }
      
      const type = getContentType(message)
      const msg = message[type]
      const body =
         type === 'conversation' ? msg :
         type === 'extendedTextMessage' ? msg.text : ['imageMessage', 'videoMessage'].includes(type) ? msg.caption :
         ''
      
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
      
      const isMedia = Boolean(msg.mimetype) && ('directPath' in msg)
      
      if (isMedia) media = msg
      
      const ctx = msg.contextInfo
      if (ctx) {
         m.exp = ctx.expiration
         m.mentions = ctx.mentionedJid
         if (ctx.quotedMessage) quoted = ctx
      }
      
      return { body: m, quoted, media }
   }
   
   getMedia = (media) => {
      const mime = media.mimetype
      const isJpeg = /jpeg/.test(mime)
      const isMp4 = /(video|mp4)/.test(mime)
      const isMp3 = /(audio|mp3)/.test(mime)
      const isWebp = ('isAnimated' in media)
      const type = isJpeg ? 'image' : isMp4 ? 'video' : isMp3 ? 'audio' : isWebp ? 'sticker' : null
      const m = {
         type,
         mime
      }
      if (isWebp) m.anim = media.isAnimated
      if (media.seconds) m.duration = media.seconds
      m.media = async () => {
         const stream = await downloadContentFromMessage(media, type)
         const buffer = []
         for await (const chunk of stream) {
            buffer.push(chunk)
         }
         return Buffer.concat(buffer)
      }
      return m
   }
   
   getQuote = (message) => {
      const { body, media } = this.getBody(message.quotedMessage, true)
      return {
         sender: message.participant,
         ...body,
         ...(Boolean(media) ? this.getMedia(media) : {})
      }
   }
}

module.exports = Ctx