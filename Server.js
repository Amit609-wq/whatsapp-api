const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(express.json());

// WhatsApp Webhook verification
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// WhatsApp incoming messages
app.post("/webhook", (req, res) => {
  console.log("WhatsApp webhook received:");
  console.log(JSON.stringify(req.body, null, 2));

  res.sendStatus(200);
});

// Send WhatsApp message
app.post("/send-message", async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: "to and message are required"
      });
    }

    const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
    const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      return res.status(500).json({
        success: false,
        error: "PHONE_NUMBER_ID or ACCESS_TOKEN is missing"
      });
    }

    const url =
      `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`;

    const response = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: {
          body: message
        }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.status(200).json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error(
      "WhatsApp API Error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Home route
app.get("/", (req, res) => {
  res.send("WhatsApp API is running!");
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
