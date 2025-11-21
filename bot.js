const {
    default: makeWASocket,
    useMultiFileAuthState,
    downloadContentFromMessage
} = require("@whiskeysockets/baileys");

const axios = require("axios");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (!text) return;

        // Check if message contains a URL
        if (text.includes("http")) {
            const apiUrl = `https://wadownloader.amitdas.site/api/?url=${encodeURIComponent(text)}`;

            await sock.sendMessage(from, { text: "Downloading your video... Please wait." });

            try {
                const res = await axios.get(apiUrl);

                if (!res.data?.url) {
                    await sock.sendMessage(from, { text: "Failed to fetch video. Invalid link." });
                    return;
                }

                const video = await axios.get(res.data.url, { responseType: "arraybuffer" });

                await sock.sendMessage(from, {
                    video: Buffer.from(video.data),
                    caption: "Here is your downloaded video 🎥"
                });

            } catch (err) {
                console.log(err);
                await sock.sendMessage(from, { text: "Error downloading video." });
            }
        }
    });
}

startBot();
