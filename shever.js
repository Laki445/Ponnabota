const express = require("express");
const path = require("path");
const fs = require("fs");
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");

const app = express();
const PORT = process.env.PORT || 10000;
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pair.html"));
});

app.post("/pair", async (req, res) => {
  const number = req.body.number;
  if (!number) return res.send({ error: "Number required" });

  try {
    const { state, saveCreds } = await useMultiFileAuthState(`sessions/${number}`);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      printQRInTerminal: false,
      auth: state,
      browser: ['FreeBot', 'Render', '1.0'],
    });

    let pairCode;
    sock.ev.on("connection.update", (update) => {
      if (update.pairingCode) {
        pairCode = update.pairingCode;
        return res.send({ code: `wa://pair/${pairCode}` });
      } else if (update.connection === "open") {
        console.log("✅ Connected");
      }
    });

    setTimeout(() => {
      if (!pairCode) return res.send({ error: "Failed to generate code." });
    }, 15000);

  } catch (e) {
    console.error("Pair error:", e);
    return res.send({ error: "Internal error while pairing." });
  }
});

app.listen(PORT, () => console.log("✅ Server started on", PORT));
