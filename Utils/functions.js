export function toArray(content) {
   if (content == null) return []
   return Array.isArray(content) ? content : [content]
}

export function toObject(obj = {}) {
   const [k, v] = Object.entries(obj)[0] || []
   return (!v || (Array.isArray(v) && !v.length)) ? {} : {
      [k]: v
   }
}