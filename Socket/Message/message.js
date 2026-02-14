import { Media } from './media.js';
import { Group } from './group.js';
import {
   isJidGroup,
   getContentType
} from 'baileys';

export class Message {
   constructor(...args) {
      this.parse(...args)
   }
   parse(ctx, opc = {}) {
      
      this.from = ctx.key.remoteJid
      this.isGroup = isJidGroup(this.from)
      this.isMe = ctx.key.fromMe
      this.sender = this.isMe ? opc.user_id : ctx.key.participant || this.from
      this.name = ctx.pushName || 'annonymous'
      this.isOwner = opc.owners?.includes(this.sender) || this.isMe
      
      const type = getContentType(ctx.message)
      const message = ctx.message[type] || {}
      this.text = (typeof message == 'string' ? message : message.caption || message.text || '').trim()
      
      if (this.text) {
         const isCommand = opc.prefix?.some(i => this.text.startsWith(i))
         if (isCommand && !opc.quote) {
            const [command, ...args] = this.text.slice(1).trim().split(/ +/)
            if (command) {
               this.isCommand = isCommand
               this.command = command.toLowerCase()
               this.text = args.join(' ')
            }
         }
      }
      
      if (typeof message !== 'string' && message) {
         const isMedia = !!message.mimetype
         if (isMedia) {
            this.isMedia = isMedia
            this.media = new Media(message, type)
         }
         const info = message.contextInfo || {}
         
         if (info.mentionedJid?.length) this.mentions = info.mentionedJid
         if (info.expiration) this.expiration = info.expiration
         
         if (info.quotedMessage && !opc.quote) {
            this.isQuote = true
            this.quote = new Message({
               key: {
                  remoteJid: info.remoteJid || this.from,
                  participant: info.participant,
                  id: info.stanzaId,
                  fromMe: info.participant == opc.user_id
               },
               message: info.quotedMessage
            }, { ...opc, quote: true })
         }
      }
      if (this.isGroup && !opc.quote) {
         this.group = new Group(this.from, {
            user_id: opc.user_id,
            sender_id: this.sender
         })
      }
   }
}