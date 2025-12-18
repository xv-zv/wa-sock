# WA-SOCK

 Es una biblioteca creada a partir de [Baileys](https://github.com/WhiskeySockets/Baileys) para simplificar la creación de un enchufe.

 => NOTA: Esta biblioteca fue creada con el fin de facilitarme la creación de un enchufe. No garantizo estabilidad y tampoco futuras actualizaciones usela bajo su propio riesgo. Espero y les resulte util.

## INSTALACION: 
```bash
npm i git+https://github.com/xv-zv/wa-sock
```
## ESM
```js
import Socket from "wa-sock";
```
## CONEXIÓN:

```js 
const bot = new Socket({
   path: "", // OPCIONAL
   phone: "", // OBLIGATORIO + CÓDIGO DE PAIS
   prefix: "", // {string|array} | DEFAULT "/"
   owner: "", // {string|array} 
   ignore: {
      chats: false, //| true
      groups: false, //| true
      status: false, //| true
      ids: [] // INCLUIR IDS A IGNORAR
   }
})

bot.start()
```
## EVENTOS:
 
### - CODE: 

 • El mas importante a incluir para recibir el código de vinculación.

 ```js 
 
bot.on("code", code => {
   console.log("=> CODIGO: "+ code)
})
 
 ```
 ### - STATUS:  
 
 • Este emitira estados de la conexión.
 ```js
 bot.on("status", reazon => {
   console.log("=> STATUS: "+ reazon)
})
 ```
### - TEXT Y MEDIA: 
 • Aqui se emitira mensajes de solo texto y media.
 ```js
 // TEXT
 bot.on("text", (m, msg) => {
   console.log("=> TEXT: "+ m)
})
// MEDIA
bot.on("media", (m, msg) => {
   console.log("=> MEDIA: "+ m)
})
 ```
 ## COMANDS: 
  • La conexión también emite comandos.
 ```js
 bot.cmd("test", (m , msg) => {
    m.reply("Esto es una prueba")
    console.log(m)
 })
 ```
 
 ## EJEMPLO: 
  • Uselo para orientarse al crear el enchufe.
  
  ```js
  import Socket from "wa-sock";
  
  const bot = new Socket({
     phone: "521215xxxxxx"
  })
  
  bot.on("code", console.log)
  bot.on("status", console.log)
  bot.cmd("hola", m => {
     m.reply("Hola como estas ?")
  })
  
  bot.start()
  ```