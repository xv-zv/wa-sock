export class Events {
   #events = {}
   on = (event, listner) => {
      if (this.#events[event]) return
      this.#events[event] = listner
   }
   off = (event, ...args) => {
      this.emit(event, ...args)
      delete this.#events[event]
   }
   cmd = (cmd, listner) => {
      if (this.cmds[cmd]) return
      this.cmds[cmd] = listner
   }
   emit = (event, ...args) => {
      if (!this.#events[event]) return
      this.#events[event](...args)
   }
   emitCmd = (cmd, ...args) => {
      if (!this.cmds[cmd]) return
      this.cmds[cmd](...args)
   }
   cmds = {}
}