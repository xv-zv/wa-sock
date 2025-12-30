import PhoneNumber from 'awesome-phonenumber'

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

export function getNumber(number) {
   number = number.replace(/\D/g, '')
   const res = PhoneNumber('+' + number)
   return {
      isValid: res.valid,
      number,
      inter: res.number?.international,
      nat: res.number?.national
   }
}

export function isObject(obj) {
   return obj !== null && typeof obj == 'object' && !Array.isArray(obj)
}

export function deepFreeze(obj) {
   if (!isObject(obj)) return
   Object.freeze(obj)
   for (const key in obj) {
      const val = obj[key]
      if (isObject(val) && !Object.isFrozen(val)) deepFreeze(val)
   }
   return obj
}

export function normalizeConfig(base = {}, input = {}) {
   
   const res = {}
   
   for (const i in base) {
      
      const baseVal = base[i]
      const inputVal = input[i]
      
      if (Array.isArray(baseVal)) {
         res[i] = toArray(baseVal, inputVal)
         continue
      }
      
      if (isObject(baseVal)) {
         res[i] = normalizeObject(baseVal, isObject(inputVal) ? inputVal : {})
         continue
      }
      
      if (i == 'code') {
         res[i] = inputVal.length == 8 ? inputVal.toUpperCase() : baseVal
         continue
      }
      
      res[i] = inputVal !== undefined ? inputVal : baseVal
      
   }
   return res
}