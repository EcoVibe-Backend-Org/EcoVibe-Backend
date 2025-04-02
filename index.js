require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
//const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
const openaiApiKey = process.env.OPENAI_KEY;
app.use(cors());
app.use(express.json());

app.post('/analyze-image', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "How can I recycle this item?" },
                { type: "image_url", image_url: { url: imageBase64 } }
              ]
            }
          ]
        })
      });

    res.json({ result: response.data });
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});


// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
