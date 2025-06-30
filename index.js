const express = require("express");
const path = require("path");
const fs = require("fs");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const { commandHandler } = require("./lib/command");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pair.html"));
});

app.get("/code", async (req, res) => {
  try {
    const number = req.query.number;
    if (!number) return res.status(400).json({ error: "Phone number required." });

    const { state, saveCreds } = await useMultiFileAuthState(`sessions/${number}`);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      printQRInTerminal: false,
      auth: state,
      browser: ['FreeBot', 'Render', '1.0'],
    });

    commandHandler(sock);

    let responded = false;

    sock.ev.on("connection.update", (update) => {
      if (update.pairingCode && !responded) {
        responded = true;
        res.json({ code: `wa://pair/${update.pairingCode}` });
      } else if (update.connection === "open") {
        console.log("✅ WhatsApp Connected");
      } else if (update.connection === "close") {
        console.log("❌ Connection closed");
      }
    });

    setTimeout(() => {
      if (!responded) {
        responded = true;
        res.status(500).json({ error: "⏱ Timeout. No QR code generated." });
      }
    }, 15000);
  } catch (err) {
    console.error("🔥 Error in /code:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
