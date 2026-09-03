import express from "express";
import Subscriber from "../models/Subscriber.js";

const router = express.Router();

// ==========================================
// ADD EMAIL SUBSCRIBER
// POST /api/subscribers
// ==========================================
router.post("/", async (req, res) => {
  try {
    const { email } = req.body;

    // VALIDATE EMAIL
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // BASIC EMAIL VALIDATION
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // CHECK IF ALREADY SUBSCRIBED
    const existingSubscriber =
      await Subscriber.findOne({
        email: cleanEmail,
      });

    if (existingSubscriber) {
      return res.status(400).json({
        success: false,
        message:
          "This email is already on the ROGUE list.",
      });
    }

    // CREATE SUBSCRIBER
    const subscriber = await Subscriber.create({
      email: cleanEmail,
    });

    return res.status(201).json({
      success: true,
      message:
        "Welcome to ROGUE. You're on the list.",
      subscriber,
    });
  } catch (error) {
    console.error(
      "Subscriber Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Could not join the list. Please try again.",
    });
  }
});

// ==========================================
// GET ALL SUBSCRIBERS
// TEMPORARY - FOR ADMIN USE
// ==========================================
router.get("/", async (req, res) => {
  try {
    const subscribers = await Subscriber.find()
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: subscribers.length,
      subscribers,
    });
  } catch (error) {
    console.error(
      "Get Subscribers Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Could not fetch subscribers",
    });
  }
});

export default router;