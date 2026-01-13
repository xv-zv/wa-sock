export let DEFAULT_OPC = {
   phone: undefined,
   path: './Sesion',
   owner: [],
   prefix: ['/'],
   ignore: {
      groups: false,
      chats: false,
      status: false,
      has: () => false
   },
   code: 'VYSVNXVZ'
}

export const colors = [
   '#FFFFFF', '#000000', '#075E54', '#128C7E', '#25D366',
   '#34B7F1', '#FFB900', '#FF6F61', '#C850C0', '#FF3B30',
   '#1E90FF', '#315575', '#6C5CE7', '#FFC107', '#008080',
   '#4CAF50', '#F44336', '#3F51B5', '#E91E63', '#795548'
];