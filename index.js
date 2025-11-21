const {
    default: makeWASocket,
    useSingleFileAuthState
} = require("@whiskeysockets/baileys");
const axios = require("axios");
const fs = require("fs");

async function startBot() {
    console.log("Starting WhatsApp Bot...");

    const { state, saveState } = useSingleFileAuthState("./session.json");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on("creds.update", saveState);

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            "";

        if (!text) return;

        // Detect URL
        if (text.includes("http")) {
            const apiUrl = `https://wadownloader.amitdas.site/api/?url=${encodeURIComponent(text)}`;

            await sock.sendMessage(from, { text: "Downloading video... please wait." });

            try {
                const res = await axios.get(apiUrl);

                if (!res.data?.url) {
                    await sock.sendMessage(from, { text: "❌ Invalid or unsupported URL." });
                    return;
                }

                const videoFile = await axios.get(res.data.url, {
                    responseType: "arraybuffer"
                });

                await sock.sendMessage(from, {
                    video: Buffer.from(videoFile.data),
                    caption: "Here is your video 🎥"
                });
            } catch (err) {
                console.error(err);
                await sock.sendMessage(from, { text: "❌ Error downloading video." });
            }
        }
    });
}

startBot();
