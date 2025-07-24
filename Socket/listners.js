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
      let [ev, n] = event.split('_')
      if (!this.events[ev]) return 
      this.events[ev].forEach(func => func(...args))
      if (n === 'off') delete this.events[ev]
   }
   
   emitCmd = (command, ...args) => {
      if (!this.commands[command]) return
      this.commands[command].shift()(...args)
      return this
   }
   
   rmAllEvents = () => this.events = {}

   rmAllCmds = () => this.commands = {}
}

module.exports = Events