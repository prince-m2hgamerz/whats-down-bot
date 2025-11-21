const {
    default: makeWASocket,
    useMultiFileAuthState
} = require("@whiskeysockets/baileys");

const axios = require("axios");
const fs = require("fs");

async function startBot() {
    console.log("Starting WhatsApp Bot...");

    const { state, saveCreds } = await useMultiFileAuthState("auth");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;

        const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            "";

        if (!text) return;

        // Detect link
        if (text.includes("http")) {
            const apiUrl = `https://wadownloader.amitdas.site/api/?url=${encodeURIComponent(
                text
            )}`;

            await sock.sendMessage(from, {
                text: "Downloading your video... please wait!"
            });

            try {
                const res = await axios.get(apiUrl);

                if (!res.data?.url) {
                    await sock.sendMessage(from, {
                        text: "❌ Failed to download video. Invalid link."
                    });
                    return;
                }

                const videoBuffer = await axios.get(res.data.url, {
                    responseType: "arraybuffer",
                });

                await sock.sendMessage(from, {
                    video: Buffer.from(videoBuffer.data),
                    caption: "🎥 Here is your downloaded video!"
                });
            } catch (err) {
                console.log(err);
                await sock.sendMessage(from, { text: "❌ Error downloading video." });
            }
        }
    });
}

startBot();
