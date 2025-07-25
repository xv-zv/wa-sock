const long = require('long').fromNumber;
const F = require('../Utils/funcs.js');
const { getFileType } = require('./helpers');

exports.sendImage = (send, img, opt = {}) =>
   send({
      image: F.setMedia(img),
      caption: F.setDesc(opt),
      mimetype: 'image/jpeg'
   }, opt);

exports.sendVideo = (send, vid, opt = {}) =>
   send({
      video: F.setMedia(vid),
      caption: F.setDesc(opt),
      mimetype: 'video/mp4',
      gifPlayback: Boolean(opt.gif)
   }, opt);

exports.sendAudio = (send, aud, opt = {}) =>
   send({
      audio: F.setMedia(aud),
      mimetype: 'audio/mpeg',
      ptt: Boolean(opt.note)
   }, opt);

exports.sendFile = async (send, media, opt = {}) => {
   const { ext, mime } = await getFileType(media);
   return send({
      document: F.setMedia(media),
      caption: F.setDesc(opt),
      fileName: (opt.name || mime.split('/')[0]) + '.' + ext,
      mimetype: mime,
      fileLength: opt.size ? long(Number(opt.size) * 1e6, true) : null
   }, opt);
};

exports.sendPoll = (send, data, opt = {}) =>
   send({
      poll: {
         name: data.name || '',
         selectableCount: data.select || 1,
         values: data.opc,
         toAnnouncementGroup: !!data.announce
      }
   }, opt);