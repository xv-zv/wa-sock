class Events {
   constructor() {
      this.events = {}
      this.commands = {}
   }
   on = (event, listner) => {
      if (typeof listner !== 'function') return this
      if (!this.events[event]) this.events[event] = []
      this.events[event].push(listner)
      return this
   }
   
   command = (command, listner) => {
      if (typeof listner !== 'function') return this
      if (!this.commands[command]) this.commands[command] = []
      this.commands[command].push(listner)
      return this
   }
   
   emit = (event, ...args) => {
      if (!this.events[event]) return
      this.events[event].forEach(func => func(...args))
   }
   
   emitCmd = (command, ...args) => {
      if (!this.commands[command]) return
      this.commands[command].shift()(...args)
      return this
   }
   
   off = (event, ...args) => {
      if (!this.events[event]) return
      this.events[event].forEach(func => func(...args))
      delete this.events[event]
   }
   
   rmAllEvents = () => this.events = {}
   
   rmAllCmds = () => this.commands = {}
}

module.exports = Events