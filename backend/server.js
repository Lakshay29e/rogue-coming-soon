import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();

/* =========================
   MIDDLEWARE
========================= */

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);

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

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
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
  const { username, password } = req.body;

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  const token = jwt.sign(
    {
      admin: true,
      username,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return res.json({
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

        subject: "Welcome to the ROGUE Waitlist.",

        html: `
        <div style="
          background:#050505;
          color:#ffffff;
          padding:50px 20px;
          font-family:Arial,Helvetica,sans-serif;
          text-align:center;
        ">

          <div style="
            max-width:600px;
            margin:auto;
            border:1px solid #222;
            background:#090909;
          ">

            <div style="
              padding:45px 25px 30px;
            ">

              <h1 style="
                margin:0;
                font-size:38px;
                letter-spacing:12px;
                font-weight:700;
                color:#f2f2f2;
              ">
                ROGUE
              </h1>

              <p style="
                margin:15px 0 0;
                font-size:10px;
                letter-spacing:5px;
                color:#777;
              ">
                NEVER MEANT TO FIT IN.
              </p>

            </div>

            <div style="
              border-top:1px solid #222;
              margin:0 35px;
            "></div>

            <div style="
              padding:45px 30px;
            ">

              <p style="
                font-size:10px;
                letter-spacing:4px;
                color:#777;
                margin:0 0 18px;
              ">
                ACCESS GRANTED
              </p>

              <h2 style="
                margin:0;
                font-size:30px;
                letter-spacing:3px;
                color:#f4f4f4;
              ">
                YOU'RE IN.
              </h2>

              <p style="
                margin:30px auto;
                max-width:420px;
                color:#aaa;
                font-size:15px;
                line-height:1.8;
              ">
                Welcome to ROGUE.
                <br />
                You've officially secured your place on the waitlist.
              </p>

              <div style="
                border-top:1px solid #222;
                margin:35px 0;
              "></div>

              <p style="
                color:#666;
                font-size:11px;
                letter-spacing:2px;
                line-height:1.8;
              ">
                THE FIRST DROP IS COMING.
                <br />
                STAY READY.
              </p>

            </div>

            <div style="
              border-top:1px solid #222;
              padding:22px;
            ">

              <p style="
                margin:0;
                color:#555;
                font-size:9px;
                letter-spacing:3px;
              ">
                ROGUE © 2026
              </p>

            </div>

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
      message:
        "Something went wrong. Try again.",
    });
  }
});

/* =========================
   GET ALL SUBSCRIBERS
   PROTECTED ADMIN ROUTE
========================= */

app.get(
  "/api/subscribers",
  verifyToken,
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
      res.status(500).json({
        success: false,
        message:
          "Failed to fetch subscribers",
      });
    }
  }
);

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 5002;

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🚀 Server running on port ${PORT}`
  );
});