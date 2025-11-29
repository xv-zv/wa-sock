const cmds = {}
const _events = {}

export const events = {
   emit(event, ...args) {
      if (!_events[event]) return
      _events[event](...args)
   },
   on(event, listner) {
      if (_events[event]) return
      _events[event] = listner
      return this
   },
   off(event, ...args) {
      this.emit(event, ...args)
      delete _events[event]
   },
   cmd(cmd, listner) {
      if (cmds[cmd]) return
      cmds[cmd] = listner
   },
   emitCmd(cmd, ...args) {
      if (!cmds[cmd]) return
      cmds[cmd](...args)
   }
}