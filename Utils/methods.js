import * as f from './functions.js'
import { OPC_CONFIG } from '../Socket/sock.js';

export const methods = (sock) => ({
   async fetchCode(phone) {
      if (!phone) return 'NOTF-OUND'
      phone = phone.replace(/\D/g, '')
      const code = await sock.requestPairingCode(phone, OPC_CONFIG)
      return code.match(/.{1,4}/g).join('-')
   },
   sendMessage(id, content, opc = {}) {
      return sock.sendMessage(id, {
         ...content,
         contextInfo: {
            expirarion: opc.ephemeral,
            mentinedJid: f.toArray(opc.tags)
         }
      })
   }
})