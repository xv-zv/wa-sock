import {
   isJidGroup,
   isLidUser,
   isJidUser,
   jidNormalizedUser,
   getContentType,
   downloadMediaMessage
} from 'baileys';
import { OPC_CONFIG } from './sock.js';
import { toArray, toObject } from '../Utils/index.js';

async function fetchMessage(sock, ctx, quote) {
   
   const from = jidNormalizedUser(ctx.key.remoteJid)
   const isGroup = isJidGroup(from)
   const isLidFrom = isLidUser(from)
   const ids = Object.values(ctx.key).filter(i => /\d+@\D/.test(i))
   const user_pn = jidNormalizedUser(ids.find(i => isJidUser(i)))
   const user_lid = jidNormalizedUser(ids.find(i => isLidUser(i)))
   const isOwner = OPC_CONFIG.owner.some(i => [user_lid, user_pn].includes(i))
   
   let m = {
      from,
      ...toObject({ isGroup }),
      ...toObject({ isLidFrom }),
      ...toObject({ id: user_lid || user_pn }),
      ...toObject({ user_pn }),
      ...toObject({ user_lid }),
      ...toObject({ name: ctx.pushName }),
      ...toObject({ isOwner })
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
            ...toObject({ text })
         }
      } else {
         m = {
            ...m,
            ...toObject({ text: body })
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
            ...toObject({ isAnimated: msg.isAnimated }),
            ...toObject({ duration: msg.seconds }),
            media: () => downloadMediaMessage(ctx, 'buffer')
         }
      }
      
      if (msg.contextInfo) {
         
         const info = msg.contextInfo
         
         m = {
            ...m,
            ...toObject({ mentions: info.mentionedJid }),
            ...toObject({ ephemeral: info.expiration })
         }
         
         if (info.quotedMessage) {
            
            m.isQuote = true
            m.quote = await fetchMessage(sock, {
               key: {
                  remoteJid: info.remoteJid || from,
                  participant: info.participant,
                  id: info.stanzaId,
                  fromMe: false // modify
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
         }, { quoted: opc.quote || ctx })
      }
      m.react = function(text) {
         return sock.sendMessage(m.from, {
            react: { text, key: ctx.key }
         })
      }
   }
   
   return m
}
export default fetchMessage