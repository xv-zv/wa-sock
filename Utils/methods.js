import { toArray } from './functions.js'
import { OPC_CONFIG } from '../Socket/sock.js';

export const methods = (sock) => ({
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
            mentinedJid: toArray(opc.tags)
         }
      }, opc)
   },
   
})