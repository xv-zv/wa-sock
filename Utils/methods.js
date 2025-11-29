export const methods = (sock, opc) => ({
   async fetchCode(phone){
      if (!phone) return 'NOTF-OUND'
      phone = phone.replace(/\D/g, '')
      const code = await sock.requestPairingCode(phone, opc.code)
      return `${code.slice(0,4)}-${code.slice(4,8)}`
   }
})