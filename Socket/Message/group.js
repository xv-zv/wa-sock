import { groupCache } from '#cache';

export class Group {
   #id = null
   
   constructor(id, options = {}) {
      this.#id = id
      this.parse(options)
   }
   
   parse(opc = {}) {
      const group = groupCache.get(this.#id)
      if (!group) return
      
      for (const key in group) {
         if (['users', 'desc'].includes(key)) continue
         this[key] = group[key]
      }
      
      const admins = group.users.filter(i => i.admin).map(i => i.id)
      
      this.isAdmin = admins.includes(opc.sender_id)
      this.isBotAdmin = admins.includes(opc.user_id)
   }
   
   get users() {
      return groupCache.get(this.#id)?.users || []
   }
   
   get desc() {
      return groupCache.get(this.#id)?.desc
   }
}