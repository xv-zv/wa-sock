const Funcs = new class {
   setArray = a => Array.isArray(a) ? a : [a]
   setMedia = url => Buffer.isBuffer(url) ? url : { url }
   setDesc = i => typeof i == 'string' ? i : i.desc || null
}