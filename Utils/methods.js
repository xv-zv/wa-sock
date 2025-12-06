import { jidNormalizedUser } from 'baileys'
import { toArray, toObject } from './functions.js'
import { OPC_CONFIG } from '../Socket/sock.js';

export const methods = (sock) => ({
   get user() {
      const user = sock.user || {}
      return {
         id: jidNormalizedUser(user.id),
         lid: jidNormalizedUser(user.lid),
         name: user.name || 'annonymous'
      }
   },
   async fetchCode(phone) {
      if (!phone) return 'NOTF-OUND'
      phone = phone.replace(/\D/g, '')
      const code = await sock.requestPairingCode(phone, OPC_CONFIG.code)
      return code.match(/.{1,4}/g).join('-')
   },
   sendMessage(id, content, opc = {}) {
      return sock.sendMessage(id, {
         ...content,
         contextInfo: {
            expiration: opc.ephemeral,
            mentinedJid: toArray(opc.mentions)
         }
      }, { quote: opc.quote || undefined })
   },
   async groupData(id) {
      
      if (!id) return {}
      const data = await sock.groupMetadata(id)
      const admins = data.participants.filter(i => i.admin !== null).map(i => i.lid)
      const isComm = data.isCommunity
      const isBotAdmin = admins.includes(this.user.lid)
      const users = data.participants.reduce((acc, user) => {
         acc.push({
            id: user.Jid,
            lid: user.lid,
            admin: user.admin !== null
         })
         return acc
      }, [])
      
      return {
         id: data.id,
         name: data.subject,
         owner: {
            id: data.ownerJid,
            lid: data.owner,
            country: data.owner_country_code
         },
         size: data.size,
         creation: data.creation,
         open: !data.announce,
         ...(isComm && { isComm }),
         ...(isComm && { parent: data.linkedParent }),
         ...toObject({ isBotAdmin }),
         users,
         ...toObject({ ephemeral: data.ephemeralDuration }),
         ...toObject({ desc: data.desc })
      }
   }
})