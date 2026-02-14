import {
   downloadContentFromMessage
} from 'baileys';

export class Media {
   #message = null
   constructor(message, type) {
      this.#message = message
      this.type = type.replace('Message', '')
      this.parse()
   }
   parse() {
      this.mime = this.#message.mimetype
      if ('isAnimated' in this.#message) this.isAnimated = this.#message.isAnimated
      if ('seconds' in this.#message) this.duration = this.#message.seconds
   }
   async download() {
      const stream = await downloadContentFromMessage(
         this.#message,
         this.type
      )
      
      const chunks = []
      
      for await (const chunk of stream) {
         chunks.push(chunk)
      }
      
      return Buffer.concat(chunks)
   }
}