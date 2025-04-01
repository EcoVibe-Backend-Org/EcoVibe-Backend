// Import libraries
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

// Initialize Express and OpenAI
const app = express();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY, // Loads from .env file
});

// Middleware
app.use(cors()); // Allow requests from React Native
app.use(express.json()); // Parse JSON bodies

// Define the API endpoint
app.post('/analyze-image', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    // Call OpenAI GPT-4 Vision
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'How can I recycle this item? Suggest 3 methods.' },
            { type: 'image_url', image_url: { url: imageBase64 } },
          ],
        },
      ],
    });

    // Send the AI's response back to React Native
    res.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});