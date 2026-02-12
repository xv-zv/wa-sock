import { groupCache } from '../Utils/index.js';

export class Group {
   constructor(id, options = {}) {
      this.#id = id
      this.parse(options)
   }
   parse(opc) {
      if (!groupCache.has(this.#id)) return
      const group = groupCache.get(this.#id)
      for (const key of group) {
         if (['users', 'desc'].includes(key)) continue
         this[key] = group[key]
      }
      const admins = group.user.filter(i => i.admin)
      this.isAdmin = admins.includes(opc.sender_id)
      this.isBotAdmin = admins.includes(opc.user_id)
   }
   get users() {
      if (groupCache.has(this.#id)) {
         return groupCache.get(this.#id).users
      }
      return []
   }
   get desc() {
      if (groupCache.has(this.#id)) {
         return groupCache.get(this.#id).desc
      }
      return undefined
   }
}