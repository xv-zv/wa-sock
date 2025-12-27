import {
   isJidGroup,
   jidNormalizedUser,
   getContentType,
   downloadMediaMessage
} from 'baileys';
import { OPC_CONFIG } from './sock.js';
import { toArray, toObject } from '../Utils/index.js';

async function fetchMessage(sock, ctx, quote) {
   
   const from = ctx.key.remoteJid
   const isGroup = isJidGroup(from)
   const isMe = ctx.key.fromMe
   const ids = Object.values(ctx.key).filter(i => /\d+@\D/.test(i))
   const [user_pn, user_lid] = ['pn', 'lid'].map(i => isMe ? sock.user[i] : jidNormalizedUser(ids.find(k => k.endsWith(i == 'pn' ? 'net' : i))))
   const id = user_lid || user_pn
   const isOwner = OPC_CONFIG.owner.includes(id)
   
   let m = {
      from,
      isGroup,
      id,
      user_pn,
      user_lid,
      name: ctx.pushName,
      isOwner,
      isMe: ctx.key.fromMe
   }
   
   const type = getContentType(ctx.message)
   const msg = ctx.message[type] || {}
   const body = (typeof msg === 'string') ? msg : msg.caption || msg.text || ''
   
   if (body) {
      
      const isCmd = OPC_CONFIG.prefix.some(i => body.startsWith(i))
      
      if (isCmd && !quote) {
         
         const [cmd, ...args] = body.trim().slice(1).split(/ +/)
         const text = args.join(' ')
         
         m = {
            ...m,
            isCmd,
            cmd,
            text
         }
      } else {
         m = {
            ...m,
            text: body
         }
      }
   }
   
   if (typeof msg !== 'string' && msg) {
      if (msg.mimetype) {
         
         m = {
            ...m,
            isMedia: true,
            type: type.replace('Message', ''),
            mime: msg.mimetype,
            isAnimated: msg.isAnimated,
            duration: msg.seconds,
            media: () => downloadMediaMessage(ctx, 'buffer')
         }
      }
      
      if (msg.contextInfo) {
         
         const info = msg.contextInfo
         
         m = {
            ...m,
            mentions: info.mentionedJid,
            ephemeral: info.expiration
         }
         
         if (info.quotedMessage) {
            
            m.isQuote = true
            m.quote = await fetchMessage(sock, {
               key: {
                  remoteJid: info.remoteJid || from,
                  participant: info.participant,
                  id: info.stanzaId,
                  fromMe: [sock.user.lid, sock.user.pn].includes(jidNormalizedUser(info.participant))
               },
               message: info.quotedMessage
            }, true)
         }
      }
   }
   
   if (!quote) {
      
      m.reply = function(text, opc = {}) {
         return sock.sendMessage(opc.from || from, {
            text,
            contextInfo: {
               expiration: opc.ephemeral || m.ephemeral,
               mentionedJid: toArray(opc.mentions || [])
            }
         }, { quote: opc.quote || ctx })
      }
      m.react = function(text) {
         return sock.sendMessage(m.from, {
            react: { text, key: ctx.key }
         })
      }
   }
   
   return toObject(m)
}
export default fetchMessage