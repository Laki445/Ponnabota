const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <h2>✅ FreeBot V11 Working!</h2>
    <p>Enter your number below to get a Pair Code.</p>
    <form method="POST" action="/pair">
      <input type="text" name="number" placeholder="+9477XXXXXXX" required />
      <button type="submit">Get Code</button>
    </form>
  `);
});

app.post('/pair', async (req, res) => {
  const number = req.body.number;
  if (!number) return res.send("❌ Number is required!");

  try {
    const response = await fetch(`http://localhost:${PORT}/code?number=${number}`);
    const data = await response.json();

    if (data.code) {
      res.send(`
        <h2>✅ Copy & Paste this on WhatsApp > Link Device</h2>
        <pre>${data.code}</pre>
        <button onclick="navigator.clipboard.writeText('${data.code}')">Copy</button>
      `);
    } else {
      res.send("❌ Pair code not received.");
    }
  } catch (err) {
    console.error("Error fetching pair code:", err);
    res.send("❌ Failed to generate code.");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
});
