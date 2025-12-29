import { jidNormalizedUser } from 'baileys'
import { toArray, toObject, random, getNumber } from './functions.js'
import { OPC_CONFIG } from '../Socket/sock.js';

const colors = [
   '#FFFFFF', '#000000', '#075E54', '#128C7E', '#25D366',
   '#34B7F1', '#FFB900', '#FF6F61', '#C850C0', '#FF3B30',
   '#1E90FF', '#315575', '#6C5CE7', '#FFC107', '#008080',
   '#4CAF50', '#F44336', '#3F51B5', '#E91E63', '#795548'
];

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
      for (const { name, phone } of content) {
         if (!phone.endsWith('net')) continue
         const business = await sock.getBusinessProfile(phone)
         const isBusiness = Boolean(business)
         
         const [name1, name2] = name.split(' ')
         const res = getNumber(phone)
         if (!res.isValid) continue
         
         const vcard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `N:${name2 || ''};${name1};;;`,
            `FN:${name}`,
            ...(isBusiness ? [`ORG:${name1}`] : [])
            `item1.TEL;waid=${res.number}:${res.inter}`,
            'item1.X-ABLabel:Móvil',
            ...(isBusiness ? [
               `X-WA-BIZ-NAME:,${name}`,
               `X-WA-BIZ-DESCRIPTION:${business.description}`
            ] : []),
            'END:VCARD'
         ].join('\n')
         
         contacts.push({
            displayName: name,
            vcard
         })
      }
      if (contacts.length == 0) return
      this.sendMessage(id, {
         contacts: {
            displayName: `${contacts.length} contactos`,
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
   const users = data.participants.reduce((acc, user) => {
      acc.push({
         ...user,
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