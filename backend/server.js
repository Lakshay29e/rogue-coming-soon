import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { BrevoClient } from "@getbrevo/brevo";

dotenv.config();

const app = express();

/* =========================
   MIDDLEWARE
========================= */

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

/* =========================
   BREVO CONFIG
========================= */

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

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

const Subscriber = mongoose.model("Subscriber", subscriberSchema);

/* =========================
   AUTH MIDDLEWARE
========================= */

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

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
   ADMIN LOGIN
========================= */

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: "Password is required",
    });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  const token = jwt.sign(
    { admin: true },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.status(200).json({
    success: true,
    token,
  });
});

/* =========================
   SUBSCRIBE ROUTE
========================= */

app.post("/api/subscribe", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    /* CHECK DUPLICATE */

    const existingSubscriber = await Subscriber.findOne({
      email: cleanEmail,
    });

    if (existingSubscriber) {
      return res.status(409).json({
        success: false,
        alreadySubscribed: true,
        message: "You are already on the list",
      });
    }

    /* SAVE SUBSCRIBER */

    const subscriber = await Subscriber.create({
      email: cleanEmail,
    });

    console.log(`📩 New ROGUE Subscriber: ${subscriber.email}`);

    /* INSTANT RESPONSE */

    res.status(201).json({
      success: true,
      message: "Welcome to ROGUE",
    });

    /* =========================
       SEND EMAIL IN BACKGROUND
    ========================= */

    brevo.transactionalEmails
      .sendTransacEmail({
        sender: {
          name: "ROGUE — NEVER MEANT TO FIT IN",
          email: process.env.SENDER_EMAIL,
        },

        to: [
          {
            email: cleanEmail,
          },
        ],

        subject: "YOU'RE IN. | ROGUE",

        htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>

<body style="
  margin:0;
  padding:0;
  background:#050505;
">

  <div style="
    background:#050505;
    padding:50px 20px;
    font-family:Arial, Helvetica, sans-serif;
    color:#ffffff;
  ">

    <div style="
      max-width:600px;
      margin:auto;
      background:#090909;
      border:1px solid #222;
      text-align:center;
    ">

      <!-- BRAND -->

      <div style="
        padding:45px 25px 30px;
      ">

        <img
          src="https://rogueclothing.vercel.app/ROGUE.jpg"
          alt="ROGUE"
          style="
            width:145px;
            max-width:80%;
            height:auto;
            display:block;
            margin:0 auto 22px;
          "
        />

        <p style="
          margin:0;
          font-family:Arial, Helvetica, sans-serif;
          font-size:10px;
          font-weight:400;
          letter-spacing:4px;
          color:#777;
        ">
          NEVER MEANT TO FIT IN.
        </p>

      </div>

      <div style="
        border-top:1px solid #222;
        margin:0 35px;
      "></div>


      <!-- MAIN CONTENT -->

      <div style="
        padding:50px 30px 45px;
      ">

        <p style="
          margin:0 0 22px;
          font-family:Arial, Helvetica, sans-serif;
          font-size:10px;
          font-weight:400;
          letter-spacing:4px;
          color:#777;
        ">
          ACCESS GRANTED
        </p>


        <!-- PREMIUM HEADLINE -->

        <h2 style="
          margin:0;
          font-family:Georgia, 'Times New Roman', serif;
          font-size:46px;
          font-weight:400;
          letter-spacing:-1px;
          line-height:1;
          color:#ffffff;
        ">
          YOU'RE IN.
        </h2>


        <p style="
          max-width:420px;
          margin:32px auto 0;
          font-family:Arial, Helvetica, sans-serif;
          color:#999;
          font-size:15px;
          font-weight:400;
          line-height:1.8;
        ">
          Welcome to ROGUE.
          <br><br>
          You've officially secured your place on the waitlist.
        </p>

        <div style="
          border-top:1px solid #222;
          margin:38px 0;
        "></div>

        <p style="
          margin:0;
          font-family:Arial, Helvetica, sans-serif;
          color:#666;
          font-size:10px;
          font-weight:400;
          letter-spacing:2.5px;
          line-height:2;
        ">
          THE FIRST DROP IS COMING.
          <br>
          STAY READY.
        </p>

      </div>


      <!-- FOOTER -->

      <div style="
        border-top:1px solid #222;
        padding:22px;
      ">

        <p style="
          margin:0;
          font-family:Arial, Helvetica, sans-serif;
          color:#555;
          font-size:9px;
          letter-spacing:3px;
        ">
          ROGUE © 2026
        </p>

      </div>

    </div>

  </div>

</body>
</html>
        `,
      })
      .then((result) => {
        console.log("✅ Confirmation email sent!");
        console.log("Brevo Message ID:", result.messageId);
      })
      .catch((emailError) => {
        console.error(
          "❌ Brevo Email Error:",
          emailError.message || emailError
        );
      });

    return;

  } catch (error) {
    console.error("❌ Subscribe Error:", error.message);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong. Try again.",
      });
    }
  }
});

/* =========================
   GET ALL SUBSCRIBERS
   PROTECTED
========================= */

app.get(
  "/api/subscribers",
  verifyToken,
  async (req, res) => {
    try {
      const subscribers = await Subscriber.find().sort({
        subscribedAt: -1,
      });

      return res.json({
        success: true,
        count: subscribers.length,
        subscribers,
      });

    } catch (error) {
      console.error(
        "Subscriber Fetch Error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch subscribers",
      });
    }
  }
);

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 5002;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});