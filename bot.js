const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // sudah deprecated, kita pakai qrcode manual
    });

    // simpan kredensial
    sock.ev.on('creds.update', saveCreds);

    // handle koneksi & QR
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('📌 Scan QR ini untuk login:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                console.log('🔄 Reconnecting...');
                startBot(); // reconnect otomatis
            } else {
                console.log('❌ Logged out, scan ulang QR');
            }
        } else if (connection === 'open') {
            console.log('✅ Bot berhasil konek!');
        }
    });

    // Hapus listener lama sebelum pasang listener baru
    sock.ev.removeAllListeners('messages.upsert');

    // handle semua pesan masuk
    sock.ev.on('messages.upsert', async (msg) => {
        try {
            for (const message of msg.messages) {
                if (!message?.message || message.key.fromMe) continue;

                const from = message.key.remoteJid;

                // Ambil teks dari berbagai tipe pesan
                const text =
                    message.message.conversation ||
                    message.message.extendedTextMessage?.text ||
                    message.message.imageMessage?.caption ||
                    message.message.videoMessage?.caption ||
                    message.message.buttonsResponseMessage?.selectedButtonId ||
                    message.message.listResponseMessage?.singleSelectReply?.selectedRowId;

                if (!text) continue;

                console.log(`📩 Pesan masuk dari ${from}:`, text);

                const lower = text.toLowerCase();

                // Auto-reply
                if (lower.includes('assalamualaikum')) {
                    await sock.sendMessage(from, { text: 'walaikumsalam wrwb' });
                } else if (lower.includes('bpjs')) {
                    await sock.sendMessage(from, { text: "hubungi irfa ‪+62 857-5864-6002‬ foto ktp dan kk saya bantu pengurusan" });
                } else if (lower.includes('bro')) {
                    await sock.sendMessage(from, { text: 'siap bro' });
                } else if (lower.includes('hukum') || lower.includes('masalah')) {
                    await sock.sendMessage(from, { text: "AK law firm hubungi pak irwan / buayin ‪+62 813-6418-7124‬" });
                } else if (lower.includes('ketemu')) {
                    await sock.sendMessage(from, { text: "boleh hubungi candra / irva , candra : ‪+62 831-7908-5515‬ irfa : ‪+62 857-5864-6002" });
                } else {
                    // fallback / log pesan lain
                    console.log('⚠️ Pesan tidak di-handle:', text);
                }
            }
        } catch (e) {
            console.error('❗ Error handle message:', e);
        }
    });
}

// Jalankan bot
startBot();

// Tangani unhandled promise rejection agar bot tidak mati
process.on('unhandledRejection', (reason, promise) => {
    console.error('❗ Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('❗ Uncaught Exception:', err);
});
