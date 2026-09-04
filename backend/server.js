import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   EMAIL CONFIGURATION
========================= */

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
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
    console.error(
      "❌ MongoDB Connection Error:",
      error.message
    );
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
   AUTH MIDDLEWARE
========================= */

const authenticateAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.admin = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
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
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
      });
    }

    if (
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password.",
      });
    }

    const token = jwt.sign(
      {
        role: "admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      token,
    });
  } catch (error) {
    console.error(
      "Admin Login Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
});

/* =========================
   SUBSCRIBE ROUTE
========================= */

app.post("/api/subscribe", async (req, res) => {
  try {
    const { email } = req.body;

    /* EMPTY EMAIL */

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    /* EMAIL VALIDATION */

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    const cleanEmail =
      email.toLowerCase().trim();

    /* CHECK DUPLICATE */

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

    /* CREATE SUBSCRIBER */

    const subscriber =
      await Subscriber.create({
        email: cleanEmail,
      });

    console.log(
      `📩 New ROGUE Subscriber: ${subscriber.email}`
    );

    /* SEND CONFIRMATION EMAIL */

    try {
      await transporter.sendMail({
        from: `"ROGUE — NEVER MEANT TO FIT IN." <${process.env.EMAIL_USER}>`,

        to: cleanEmail,

        subject: "YOU'RE IN. — ROGUE",

        html: `
          <div style="
            background:#050505;
            color:#ffffff;
            padding:60px 25px;
            font-family:Arial, Helvetica, sans-serif;
            text-align:center;
          ">

            <div style="
              max-width:600px;
              margin:auto;
              border:1px solid #222;
              padding:50px 30px;
              background:#080808;
            ">

              <img
                src="https://rogue-coming-soon.vercel.app/ROGUE.png"
                alt="ROGUE"
                style="
                  width:180px;
                  max-width:80%;
                  margin-bottom:35px;
                "
              />

              <p style="
                letter-spacing:4px;
                font-size:10px;
                color:#777;
                margin-bottom:25px;
              ">
                ACCESS GRANTED
              </p>

              <h1 style="
                font-size:42px;
                font-weight:700;
                letter-spacing:2px;
                margin:0 0 25px;
                line-height:1.1;
              ">
                YOU'RE IN.
              </h1>

              <div style="
                width:40px;
                height:1px;
                background:#555;
                margin:30px auto;
              "></div>

              <p style="
                color:#b5b5b5;
                font-size:16px;
                line-height:1.8;
                margin:0 auto 25px;
                max-width:420px;
              ">
                Welcome to ROGUE.
                <br />
                You've officially secured your place
                on the waitlist.
              </p>

              <p style="
                color:#888;
                font-size:14px;
                line-height:1.7;
                margin-bottom:40px;
              ">
                You'll be among the first to know
                when the new order begins.
              </p>

              <div style="
                border-top:1px solid #222;
                margin:35px 0 25px;
              "></div>

              <p style="
                letter-spacing:3px;
                font-size:10px;
                color:#777;
                margin:0;
              ">
                NEVER MEANT TO FIT IN.
              </p>

              <p style="
                font-size:9px;
                color:#444;
                margin-top:30px;
                letter-spacing:2px;
              ">
                © 2026 ROGUE
              </p>

            </div>

          </div>
        `,
      });

      console.log(
        `📧 Confirmation email sent to ${cleanEmail}`
      );
    } catch (emailError) {
      console.error(
        "❌ Email sending failed:",
        emailError.message
      );
    }

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
   PROTECTED ADMIN ROUTE
========================= */

app.get(
  "/api/subscribers",
  authenticateAdmin,
  async (req, res) => {
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
      console.error(
        "Subscribers Fetch Error:",
        error.message
      );

      res.status(500).json({
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

app.listen(PORT, "127.0.0.1", () => {
  console.log(
    `🚀 Server running on http://127.0.0.1:${PORT}`
  );
});