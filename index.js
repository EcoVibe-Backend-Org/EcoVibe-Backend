require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/api/users", require("./routers/userRoutes"))
app.use("/api/users", require("./routers/CommentRoutes"))
app.use("/api/users", require("./routers/CommentRoutes"))
const mongoose = require("mongoose")

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then((result) => {
    app.listen(3000, () => {
        console.log("server is running")
    })
}).catch((err) => {
    console.log(err)
})


app.post("/analyze-image", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64)
      return res.status(400).json({ error: "No image provided" });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Using Egypt's recycling guidelines: Identify the item's material and explain its recycling process. " +
                "Conclude with '[END]' when finished. Strict 300-word limit.",
            },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        },
      ],
      max_tokens: 400,
      stop: ["[END]"],
    });

    let finalChunkSent = false;
    for await (const chunk of stream) {
      if (finalChunkSent) break;

      const textChunk = chunk.choices?.[0]?.delta?.content || "";
      const endIndex = textChunk.indexOf("[END]");

      if (endIndex > -1) {
        // Send final chunk without [END] marker
        res.write(
          `data: ${JSON.stringify({
            chunk: textChunk.substring(0, endIndex),
          })}\n\n`
        );
        finalChunkSent = true;
      } else {
        res.write(`data: ${JSON.stringify({ chunk: textChunk })}\n\n`);
      }
    }

    // Explicit termination message
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Error analyzing image:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "AI analysis failed: " + error.message });
    }
  }
});
// Simple Health Check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Start the server
// const PORT = 3000;
// app.listen(PORT, () => {
//   console.log(`Backend running on http://localhost:${PORT}`);
// });
