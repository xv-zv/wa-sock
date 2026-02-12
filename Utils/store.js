import { AsyncLocalStorage } from 'async_hooks';
export const storeCache = new AsyncLocalStorage()
export const groupCache = new Map()

export function changeGroupCache(id, options) {
   const { tag } = options || {}
   if (!groupsCache.has(id)) return
   
   if (tag == 'users') {
      return changeUsers(id, options)
   }
   changeConfig(options)
}

function changeUsers(jid, options) {
   const group = groupCache.get(jid) || {}
   const { tag, change, content } = options
   
   if (change.type == 'array' && content) {
      for (const { id, action } of content) {
         if (action == 'add') {
            group[tag].push({
               id,
               admin: false
            })
            group.size += 1
            continue
         }
         if (action == 'remove') {
            group[tag].filter(i => i.id !== id)
            group.size -= 1
            groupCache(jid, group)
            continue
         }
         if (['demote', 'promote'].includes(action)) {
            const user = group[tag].find(i => i.id == id)
            if (user) user.admin = action == 'promote' ? true : false
            continue
         }
      }
   }
}

function changeConfig(jid, options) {
   const group = groupCache.get(jid) || {}
   const { tag, change } = options || {}
   const value = group[tag]
   if (value) value = change.to
}