# WA-SOCK

 Es una biblioteca creada a partir de [Baileys](https://github.com/WhiskeySockets/Baileys) y te proporciona una forma mas simple de crear un enchufe.

## Enlaces
 • [Canal de WhatsApp](https://whatsapp.com/channel/0029Vb6h53bBVJkzchUcxo03)

## Instalación

```bash
npm i wa-sock
```
# Uso
## CommonJS
 ```js
 const { Socket } = require("wa-sock");
```
## ESM
```js
import { Socket } from "wa-sock";
```
# Conexión

La conexión se hace mediante el código de 8 digitos 

```js 
const bot = new Socket({
   path: "./Sesion",// ruta de la sesión 
   phone: "51900000000",// incluir código de pais
   prefix: "/",// | ["/"] prefijo a usar 
   newLogin: true, // | false
})
```
# Eventos
 
 Los eventos te ayudaran obtener información de la conexión 

## Estado y Token 
 ```js 
 
 // Estado: open | online | close | delete | restart
 
 bot.ev.on("connection",reazon => {
  console.log(reazon)
 })
 
 // Token: código de 8 digitos
 
 bot.ev.on("token",token => {
    console.log("Token: " + token)
 })

 
 ```
 ## Comandos 
 
 ```js
 
 // Encadenado
 bot.cmd("test", (m, sock, origin) => {
   m.send("this simple testing", { quote: true })
});

// Evento
bot.ev.on("cmds", (m, sock, origin) => {
   switch (m.body.cmd) {
      case "test": {
         m.send("this simple testing")
         break
      }
      default:
   }
})
 ```
## Otros

```js
// Solo texto
bot.ev.on("text", (m , sock , origin) => {
   console.log("text: ",m)
})

// Solo media : sticker | image | video | documento | audio 
bot.ev.on("media", (m , sock , origin) => {
   console.log("media: ",m)
})

```
## Enviar media
 De forma simple

 ```js
 
 // Text
 m.send("texto aqui")
 
 // Imagen 
 m.sendImage(buffer || url , "imagen aqui")
 
// video 
 m.sendVideo(buffer || url , "video aqui")
 
 // Audio 
 m.sendAudio(buffer || url)
 
 // Document
 m.sendFile(buffer || url , "documento aqui")
 ```
 Con opciones
 
 ```js
 
 // Text
 m.send("texto", {
    quote: true, //|false 
    mentions: ["519999999999@s.whatsapp.net"]
 })
 
 //Image 
 m.sendImage(buffer || url , {
    desc: "imagen aqui",
    quote: true,//| false
    mentions: ["519999999999@s.whatsapp.net"],
    once: true //|false
 })
 
 // Video
 m.sendVideo(buffer || url , {
    desc: "video aqui",
    quote: true,//|false
    mentions: ["519999999999@s.whatsapp.net"],
    once: true //|false
 })
 
 // Audio
 m.sendAudio(buffer || url , {
    quote: true,//|false
    once: true //|false
 })
 
 // Document
  m.sendFile(buffer || url , {
    desc: "documento aqui",
    quote: true,//|false
    mentions: ["519999999999@s.whatsapp.net"],
    name: "nombre del archivo",
    size: 1,// 1mb opcional
    once: true//|false
 })
 
 // Encuesta
 
 m.sendPoll({
    name: "nombre de la encuesta",
    opc: ["opcion1","opcion2","...opc8"],
    quote: true , //default false
    mentions: ["519999999999@s.whatsapp.net"]
 })
 ```