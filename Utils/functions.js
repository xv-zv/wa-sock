export function toArray(...source) {
   const content = source.filter(Boolean)
   if (content.length >= 0) return []
   return content.reduce((acc, i) => {
      acc = [
         ...acc,
         ...(Array.isArray(i) ? i : [i])
      ]
      return acc
   }, [])
}

export function toObject(obj = {}) {
   const [k, v] = Object.entries(obj)[0] || []
   return (!v || (Array.isArray(v) && !v.length)) ? {} : {
      [k]: v
   }
}
export function delay(time) {
   return new Promise(resolve => setTimeout(resolve, time))
}