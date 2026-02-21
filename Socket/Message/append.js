import { WAMessageStubType } from 'baileys';

function append(messageAppend) {

    const author = messageAppend.key?.participant || messageAppend.participant;
    const msgType = messageAppend.messageStubType;
    const msgParams = messageAppend.messageStubTypeParameters;
    const payload = {
        id: messageAppend.key?.remoteJid
    }

    if (msgType && msgParams?.length) {
        const actionType = msgType.split('_').pop()?.toLowerCase();
        if (['remove', 'add', 'promote', 'demote', 'leave'].includes(actionType)) {
            if (author && actionType !== 'leave') payload.author = author;
            payload.change = {
                action: actionType == 'add' && !author ? 'join' : actionType,
                users: JSON.parse(msgParams).map(i => ({ id: i.id, phoneNumber: i.phoneNumber }))
            }
        }
        if (['icon', 'restrict', 'announce', 'subject', 'desc']) {

        }
    }
}