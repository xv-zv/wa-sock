export function toArray(...source) {
   const content = source.filter(Boolean)
   if (content.length <= 0) return []
   return [...new Set(content.flat())];
}

export function toObject(obj = {}) {
   return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v && (!Array.isArray(v) || v.length)))
}

export function delay(time) {
   return new Promise(resolve => setTimeout(resolve, time))
}

export function random(input) {
   if (Array.isArray(input)) return input[Math.floor(Math.random() * input.length)]
   if (typeof input == 'number') return Math.floor(Math.random() * input)
   return Math.floor(Math.random() * 2)
}