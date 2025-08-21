const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require('@whiskeysockets/baileys')
const qrcode = require('qrcode-terminal')

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info')

    const sock = makeWASocket({
        auth: state,
        // printQRInTerminal sudah deprecated → jangan dipakai lagi
    })

    // simpan kredensial
    sock.ev.on('creds.update', saveCreds)

    // handle koneksi & QR
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            // kalau butuh scan ulang → tampilkan QR di terminal
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode
            if (reason !== DisconnectReason.loggedOut) {
                console.log('🔄 Reconnecting...')
                startBot()
            } else {
                console.log('❌ Logged out, scan ulang QR')
            }
        } else if (connection === 'open') {
            console.log('✅ Bot berhasil konek!')
        }
    })

    // handle pesan masuk
    sock.ev.on('messages.upsert', async (msg) => {
        try {
            const message = msg.messages[0]
            if (!message?.message || message.key.fromMe) return

            const from = message.key.remoteJid

            const text =
                message.message.conversation ||
                message.message.extendedTextMessage?.text ||
                message.message.imageMessage?.caption ||
                message.message.videoMessage?.caption

            if (!text) return
            console.log('📩 Pesan masuk:', text)

            const lower = text.toLowerCase()

            if (lower.includes('assalamualaikum')) {
                await sock.sendMessage(from, { text: 'walaikumsalam wrwb' })
            } else if (lower.includes('bpjs')) {
                await sock.sendMessage(from, { text: "hubungi irfa ‪+62 857-5864-6002‬ foto ktp dan kk saya bantu pengurusan" })
            } else if (lower.includes('bro')) {
                await sock.sendMessage(from, { text: 'siap bro' })
            } else if (lower.includes('hukum') || lower.includes('masalah')) {
                await sock.sendMessage(from, { text: "AK law firm hubungi pak irwan / buayin ‪+62 813-6418-7124‬" })
            } else if (lower.includes('ketemu')) {
                await sock.sendMessage(from, { text: "boleh hubungi candra / irva , candra : ‪+62 831-7908-5515‬ irfa : ‪+62 857-5864-6002" })
            }
        } catch (e) {
            console.error('❗ Error handle message:', e)
        }
    })
}

startBot()
