const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(express.static("public"));

app.use("/api/", rateLimit({
  windowMs: 60 * 1000,
  limit: 10
}));

app.post("/api/chat", async (req, res) => {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.status(500).json({
        error: "AI kaliti serverda sozlanmagan."
      });
    }

    const message = String(req.body.message || "").trim();
    if (!message || message.length > 3000) {
      return res.status(400).json({
        error: "Xabar bo‘sh yoki juda uzun."
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: message }]
          }],
          generationConfig: {
            maxOutputTokens: 700
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: "AI xizmatida xatolik yuz berdi."
      });
    }

    const answer =
      data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") || "Javob olinmadi.";

    res.json({ answer });
  } catch {
    res.status(500).json({
      error: "Serverda xatolik yuz berdi."
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server ${port}-portda ishga tushdi`);
});
