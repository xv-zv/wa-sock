import { OPC_CONFIG } from './sock.js';
import { colors } from '.././Defaults/index.js';
import {
   jidNormalizedUser,
   S_WHATSAPP_NET
} from 'baileys';
import {
   toArray,
   toObject,
   random,
   getNumber
} from '../Utils/index.js';


export const methods = (sock) => ({
   get user() {
      const user = sock.user || {}
      const [pn, lid] = ['id', 'lid'].map(i => jidNormalizedUser(user[i]))
      return {
         id: lid || pn,
         pn,
         lid,
         name: user.name || 'annonymous'
      }
   },
   async getPNForLID(id) {
      if (!id.endsWith('lid')) return
      const mapping = sock.signalRepository.lidMapping
      const result = typeof mapping.getPNForLID == 'function' ? await mapping.getPNForLID(id) : mapping.mappingCache.get(`lid:${id.replace(/\D/g,'')}`) + S_WHATSAPP_NET
      return jidNormalizedUser(result)
   },
   async getLIDForPN(id) {
      if (!id.endsWith(S_WHATSAPP_NET)) return
      const res = await sock.signalRepository.lidMapping.pnToLIDFunc(toArray(id))
      return jidNormalizedUser(res?.[0]?.pn)
   },
   async fetchCode(phone) {
      if (!phone) return 'NOTF-OUND'
      phone = phone.replace(/\D/g, '')
      const code = await sock.requestPairingCode(phone, OPC_CONFIG.code.toUpperCase())
      return code.match(/.{1,4}/g)?.join('-')
   },
   sendMessage(id, content, opc = {}) {
      return sock.sendMessage(id, {
         ...content,
         contextInfo: {
            ...(content.contextInfo || {}),
            expiration: opc.ephemeral,
            mentionedJid: toArray(opc.mentions)
         }
      }, {
         ...(id === 'status@broadcast' ? {
            ...(Boolean(content.text) ? {
               backgroundColor: opc.color || random(colors),
               font: opc.font || random(5)
            } : {}),
            statusJidList: toArray(opc.jidList),
            broadcast: true
         } : {}),
         quoted: opc.quote || undefined,
      })
   },
   async sendContact(id, content, opc = {}) {
      content = toArray(content)
      const contacts = []
      
      for (const { name, phone, ...data } of content) {
         
         if (!phone.endsWith('net')) continue
         
         const business = await sock.getBusinessProfile(phone)
         
         const [name1, name2] = name.split(' ')
         const res = getNumber(phone)
         
         if (!res.isValid) continue
         
         const vcard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `N:${name2 || ''};${name1};;;`,
            `FN:${name}`,
            `item1.TEL;waid=${res.number}:${res.inter}`,
            'item1.X-ABLabel:Móvil',
            ...(business ? [
               `ORG:${data.org || name1}`
               `X-WA-BIZ-NAME:${name}`,
               `X-WA-BIZ-DESCRIPTION:${data.desc || business.description}`
            ] : []),
            'END:VCARD'
         ].join('\n').trim()
         
         contacts.push({
            displayName: name,
            vcard
         })
      }
      if (contacts.length == 0) return
      this.sendMessage(id, {
         contacts: {
            displayName: contacts.length > 1 ? `${contacts.length} contactos` : content[0]?.name,
            contacts
         }
      }, opc)
   },
   async groupData(id) {
      if (!id) return {}
      return gpNormalizeData.call(this, await sock.groupMetadata(id))
   },
   async fetchGroupsAll() {
      try {
         const groups = Object.values(await sock.groupFetchAllParticipating()).filter(i => !i.isCommunity)
         return groups.map(i => gpNormalizeData.call(this, i))
      } catch {
         return []
      }
   }
})

function gpNormalizeData(data) {
   
   if (typeof data !== 'object') return
   
   const admins = data.participants.filter(i => i.admin !== null).map(i => i.lid)
   const isComm = data.isCommunity
   const isBotAdmin = admins.includes(this.user.lid)
   const users = data.participants.map(user => ({
      ...i,
      admin: user.admin !== null
   }))
   
   return toObject({
      id: data.id,
      name: data.subject || 'annonymous',
      owner: {
         id: data.ownerJid,
         lid: data.owner,
         country: data.owner_country_code
      },
      size: data.size,
      creation: data.creation,
      open: !data.announce,
      isComm,
      ...(isComm && { parent: data.linkedParent }),
      isBotAdmin,
      users,
      ephemeral: data.ephemeralDuration,
      desc: data.desc
   })
}