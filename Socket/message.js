import {
   isJidGroup,
   isLidUser,
   isJidUser,
   jidNormalizedUser,
   getContentType
} from 'baileys';
import { OPC_CONFIG } from './sock.js';

const toObject = obj => {
   const [key, val] = Object.entries(obj)[0]
   return !Boolean(val) ? {} : {
      [key]: val
   }
}

async function fetchMessage(sock, ctx, quote) {
   
   const from = jidNormalizedUser(ctx.key.remoteJid)
   const isGroup = isJidGroup(from)
   const isLidFrom = isLidUser(from)
   const ids = Object.values(ctx.key).filter(i => /\d+@\D/.test(i))
   const user_pn = ids.find(i => isJidUser(i))
   const user_lid = ids.find(i => isLidUser(i))
   
   let m = {
      from,
      ...toObject({ user_pn }),
      ...toObject({ user_lid }),
      ...toObject({ name: ctx.pushName })
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
            ...toObject({ duration: msg.seconds })
         }
      }
   }
   
   console.log(m, OPC_CONFIG)
   return m
}
export default fetchMessage