import DEFAULT_CONFIG from '../Defaults/index.js'

export function normalizedConfig(input = {}) {
   return Object.keys(DEFAULT_CONFIG).reduce((acc, key) => {
      const base = DEFAULT_CONFIG[key]
      const value = input[key]
      
      acc[key] = Array.isArray(base) ?
         value == null ?
         base : [].concat(value).filter(Boolean) : value ?? base
      
      return acc
   }, {})
}