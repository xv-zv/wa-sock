import { Message } from './message.js';

export class Quote extends Message {
   constructor(message, opc = {}) {
      super({
         key: {
            remoteJid: message.remoteJid || opc.from,
            participant: message.participant,
            id: message.stanzaId,
            fromMe: message.participant == opc.user_id
         },
         message: message.quotedMessage
      }, { ...opc, quote: true })
   }
}