export class Events {
   #events = new Map()
   #cmds = new Map()
   
   #has = event => this.#events.has(event)
   #get = event => this.#events.get(event)
   
   on = (event, listner) => {
      if (!this.#has(event)) this.#events[event] = []
      const listners = this.#get(event)
      listners.push(listner)
      return this
   }
   
   off = (event, ...args) => {
      this.emit(event, ...args)
      this.#events.delete(event)
      return this
   }
   
   cmd = (cmd, listner) => {
      cmd = cmd.toLowerCase()
      if (this.#cmds.has(cmd)) return this
      this.#cmds.set(cmd, listner)
      return this
   }
   
   emit = (event, ...args) => {
      if (!this.#has[event]) return this
      const listners = this.#get(event)
      for (const listner of listners) {
         listner(...args)
      }
      return this
   }
   
   emitCmd = (cmd, ...args) => {
      if (!this.#cmds.has(cmd)) return this
      this.#cmds.get(cmd)(...args)
      return this
   }
   
   offCmd = (cmd, ...args) => {
      this.emitCmd(cmd, ...args)
      this.#cmds.delete(cmd)
      return this
   }
   
   get cmds() {
      return this.#cmds
   }
}