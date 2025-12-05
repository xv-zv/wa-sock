import {
   isJidGroup,
   isLidUser,
   isJidUser,
   jidNormalizedUser,
   getContentType
} from 'baileys';
const toObject = obj =>  obj && { [obj]: obj }

async function fetchMessage(sock, ctx, quote) {
   
   const from = jidNormalizedUser(ctx.key.remoteJid)
   const isGroup = isJidGroup(from)
   const isLidFrom = isLidUser(from)
   const ids = Object.values(ctx.key).filter(i => /\d+@\D/.test(i))
   const user_pn = ids.find(i => isJidUser(i))
   const user_lid = ids.find(i => isLidUser(i))
   let m = {
      from, 
      ...toObject(user_pn),
      ...toObject(user_lid)
   }
   
   console.log(ctx, m)
   return {}
}
export default fetchMessage