const number = process.argv[2] || "session";
const { useMultiFileAuthState, fetchLatestBaileysVersion, default: makeWASocket } = require("@whiskeysockets/baileys");
const { commandHandler } = require("./lib/command");

(async () => {
  const { state, saveCreds } = await useMultiFileAuthState(`sessions/${number}`);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ['FreeBot', 'Chrome', '1.0']
  });

  commandHandler(sock);

  sock.ev.on("connection.update", async (update) => {
    if (update.pairingCode) {
      console.log(`wa://pair/${update.pairingCode}`);
    } else if (update.connection === "open") {
      console.log("✅ WhatsApp Connected!");
    } else if (update.connection === "close") {
      console.log("❌ Disconnected!");
    }
  });

  setTimeout(() => {
    console.log("⏰ Timeout. No QR code generated.");
    process.exit(1);
  }, 15000);
})();
