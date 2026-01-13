import {
   isJidGroup,
   jidNormalizedUser,
   getContentType,
   downloadMediaMessage
} from 'baileys';
import { OPC_CONFIG } from './sock.js';
import { toArray, toObject } from '../Utils/index.js';

async function fetchMessage(sock, ctx, quote) {
   
   let m = {
      from: ctx.key.remoteJid,
   }
   
   m.isGroup = isJidGroup(m.from)
   m.isMe = ctx.key.fromMe
   
   const ids = Object.values(m.isMe ? sock.user : ctx.key).filter(i => /\d+@\D/.test(i))
   const user_lid = ids.find(i => i.endsWith('lid'))
   const user_pn = jidNormalizedUser(ids.find(i => i.endsWith('net'))) || await sock.getPNForLID(user_lid)
   
   m.id = user_lid || user_pn
   m.name = ctx.pushName
   m.user_lid = user_lid
   m.user_pn = user_pn
   m.isOwner = OPC_CONFIG.owner.includes(m.id) || m.isMe
   
   const group = !quote && m.isGroup ? await sock.groupData(m.from) : null
   
   m.isAdmin = group && group.users.some(i => i.id == m.id && i.admin)
   
   const type = getContentType(ctx.message)
   const msg = ctx.message[type] || {}
   const body = (typeof msg === 'string') ? msg : msg.caption || msg.text || ''
   
   if (body) {
      
      const isCmd = OPC_CONFIG.prefix.some(i => body.startsWith(i))
      const [cmd, ...args] = body.trim().slice(1).split(/ +/)
      
      m = {
         ...m,
         ...((isCmd && !quote) ? {
            isCmd,
            cmd: cmd.toLowerCase(),
            text: args.join(' ')
         } : { text: body })
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
                  remoteJid: info.remoteJid || m.from,
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
      
      if (m.isGroup) {
         
         const gp = await sock.groupData(m.from)
         
         m = {
            ...m,
            get group() {
               return {
                  name: group.name,
                  open: group.open
                  owner: group.owner,
                  isComm: group.isComm,
                  isAdmin: group.users.some(i => i.id == m.id && i.admin),
                  isBotAdmin
               }
            }
         }
      }
      
      m.reply = function(text, opc = {}) {
         return sock.sendMessage(opc.from || from, {
            text
         }, { ...opc, ephemeral: opc.ephemeral || m.ephemeral, quote: opc.quote || ctx })
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