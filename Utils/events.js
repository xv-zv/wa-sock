export class EventsEmiter {
   #events = new Map()
   #commands = new Map()
   
   emit(event, ...args) {
      this.#events.get(event)?.forEach(fn => fn(...args))
   }
   
   on(event, listener) {
      const list = this.#events.get(event) ?? []
      list.push(listener)
      this.#events.set(event, list)
   }
   
   emitCmd(command, ...args) {
      this.#commands.get(command)?.(...args)
   }
   
   cmd(command, listener) {
      command = command.toLowerCase()
      if (this.#commands.has(command)) return
      this.#commands.set(command, listener)
   }
   
   hasCmd(command) {
      return this.#commands.has(command.toLowerCase())
   }
}