import {
   isJidGroup,
   isLidUser,
   jidNormalizedUser,
   getContentType
} from 'baileys';

async function fetchMessage(sock, ctx, quote) {
   
   const from = jidNormalizedUser(ctx.key.remoteJid)
   const isGroup = isJidGroup(from)
   const isLidFrom = isLidUser(from)
   const ids = Object.values(ctx.key).filter(i => /\d+@\D/.test(i))
   
   console.log(ctx, ids)
   return {}
}
export default fetchMessage