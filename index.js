import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@adiwajshing/baileys';
import { Boom } from '@hapi/boom';
import fs from 'fs';

async function startBot() {
    // Guardar estado de autenticación en la carpeta 'auth_info'
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    // Guardar credenciales cada vez que cambian
    sock.ev.on('creds.update', saveCreds);

    // Manejar desconexiones
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if(connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            console.log('Conexión cerrada:', reason);
            if(reason !== DisconnectReason.loggedOut) {
                startBot(); // reconectar
            }
        } else if(connection === 'open') {
            console.log('Bot conectado correctamente ✅');
        }
    });

    // Manejar mensajes entrantes
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if(!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        // Comando básico: !venta <codigo>
        if(text?.startsWith('!venta')) {
            const code = text.split(' ')[1];
            if(!code || code.length !== 8) {
                await sock.sendMessage(msg.key.remoteJid, { text: '❌ Código inválido. Debe tener 8 dígitos.' });
                return;
            }

            // Aquí podrías agregar la lógica de tu venta
            await sock.sendMessage(msg.key.remoteJid, { text: `✅ Código recibido: ${code}. Venta procesada.` });
        }
    });
}

startBot();
