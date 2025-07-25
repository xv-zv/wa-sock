const {
   getContentType,
   downloadContentFromMessage
} = require('@whiskeysockets/baileys');
const {
   fileTypeFromStream,
   fileTypeFromBuffer
} = require('file-type');
const fetch = require('node-fetch');

const getFrom = key => {
   let id = key.remoteJid
   return {
      id,
      sender: key.participant || id,
      group: id.endsWith('@g.us')
   }
}

const getBody = (message, { quoted, ...o } = {}) => {
   const m = {}
   let media
   const isMsg = message && !message.protocolMessage
   
   if (isMsg) {
      
      const type = getContentType(message)
      const msg = message[type]
      const body =
         type === 'conversation' ? msg :
         type === 'extendedTextMessage' ? msg.text : ['imageMessage', 'videoMessage'].includes(type) ? msg.caption :
         ''
      
      m.text = body
      
      if (!o.quoted && body) {
         const isCmd = o.prefixes.some(i => body.startsWith(i))
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
   }
   return { body: m, quoted, media }
}

const getMedia = media => {
   const mime = media.mimetype
   const isWebp = ('isAnimated' in media)
   const type = /jpeg/.test(mime) ? 'image' : /(video|mp4)/.test(mime) ? 'video' : /(audio|mp3)/.test(mime) ? 'audio' : isWebp ? 'sticker' : 'document'
   
   const m = { type, mime }
   
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

const getQuote = msg => {
   const { media, body } = getBody(msg.quotedMessage, { quoted: true })
   return {
      sender: msg.participant,
      ...body,
      ...(Boolean(media) ? media : {})
   }
};

const getFileType = async input => {
   if (/https?:\/\/[^\s"'`]+/.test(input)) {
      const res = await fetch(input);
      return fileTypeFromStream(res.body);
   }
   if (Buffer.isBuffer(input)) {
      return fileTypeFromBuffer(input);
   }
   return { ext: 'bin', mime: 'application/octet-stream' };
};

module.exports = {
   getFrom,
   getMedia,
   getBody,
   getQuote,
   getFileType
}