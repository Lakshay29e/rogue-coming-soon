import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   MONGODB CONNECTION
========================= */

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully!");
  })
  .catch((error) => {
    console.error("❌ MongoDB Connection Error:", error.message);
  });

/* =========================
   SUBSCRIBER MODEL
========================= */

const subscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    subscribedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "subscribers",
  }
);

const Subscriber = mongoose.model(
  "Subscriber",
  subscriberSchema
);

/* =========================
   TEST ROUTE
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ROGUE Backend is running 🚀",
  });
});

/* =========================
   SUBSCRIBE ROUTE
========================= */

app.post("/api/subscribe", async (req, res) => {
  try {
    const { email } = req.body;

    // Empty email
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check duplicate
    const existingSubscriber =
      await Subscriber.findOne({
        email: cleanEmail,
      });

    if (existingSubscriber) {
      return res.status(409).json({
        success: false,
        alreadySubscribed: true,
        message: "You are already on the list",
      });
    }

    // Create subscriber
    const subscriber =
      await Subscriber.create({
        email: cleanEmail,
      });

    console.log(
      `📩 New ROGUE Subscriber: ${subscriber.email}`
    );

    return res.status(201).json({
      success: true,
      message: "Welcome to ROGUE",
    });
  } catch (error) {
    console.error(
      "Subscribe Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Try again.",
    });
  }
});

/* =========================
   GET ALL SUBSCRIBERS
========================= */

app.get("/api/subscribers", async (req, res) => {
  try {
    const subscribers =
      await Subscriber.find().sort({
        subscribedAt: -1,
      });

    res.json({
      success: true,
      count: subscribers.length,
      subscribers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscribers",
    });
  }
});

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(
    `🚀 Server running on http://localhost:${PORT}`
  );
});