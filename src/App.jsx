import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import "./App.css";

function App() {
const launchDate = new Date(
"2026-11-27T00:00:00+05:30"
).getTime();

const calculateTimeLeft = () => {
const difference = launchDate - Date.now();


if (difference <= 0) {
  return {
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  };
}

return {
  days: String(
    Math.floor(difference / (1000 * 60 * 60 * 24))
  ).padStart(2, "0"),

  hours: String(
    Math.floor((difference / (1000 * 60 * 60)) % 24)
  ).padStart(2, "0"),

  minutes: String(
    Math.floor((difference / (1000 * 60)) % 60)
  ).padStart(2, "0"),

  seconds: String(
    Math.floor((difference / 1000) % 60)
  ).padStart(2, "0"),
};


};

const [timeLeft, setTimeLeft] = useState(
calculateTimeLeft()
);

const [email, setEmail] = useState("");
const [message, setMessage] = useState("");
const [loaded, setLoaded] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);

const [showSuccessPopup, setShowSuccessPopup] =
useState(false);

const [showAlreadyPopup, setShowAlreadyPopup] =
useState(false);

const [showEmptyPopup, setShowEmptyPopup] =
useState(false);

const [showInvalidPopup, setShowInvalidPopup] =
useState(false);

const [scrolled, setScrolled] = useState(false);
const [scrollProgress, setScrollProgress] =
useState(0);

const [visibleSections, setVisibleSections] =
useState({
about: false,
statement: false,
notify: false,
});

/* COUNTDOWN + LOADER */

useEffect(() => {
const countdownTimer = setInterval(() => {
setTimeLeft(calculateTimeLeft());
}, 1000);


const loaderTimer = setTimeout(() => {
  setLoaded(true);
}, 900);

return () => {
  clearInterval(countdownTimer);
  clearTimeout(loaderTimer);
};


}, []);

/* SCROLL REVEAL */

useEffect(() => {
const observer = new IntersectionObserver(
(entries) => {
entries.forEach((entry) => {
if (!entry.isIntersecting) return;


      const sectionName =
        entry.target.dataset.section;

      setVisibleSections((prev) => ({
        ...prev,
        [sectionName]: true,
      }));

      observer.unobserve(entry.target);
    });
  },
  {
    threshold: 0.15,
  }
);

const sections =
  document.querySelectorAll("[data-section]");

sections.forEach((section) =>
  observer.observe(section)
);

return () => observer.disconnect();


}, []);

/* NAVBAR + SCROLL PROGRESS */

useEffect(() => {
const handleScroll = () => {
const scrollTop = window.scrollY;


  const scrollableHeight =
    document.documentElement.scrollHeight -
    window.innerHeight;

  const progress =
    scrollableHeight > 0
      ? (scrollTop / scrollableHeight) * 100
      : 0;

  setScrolled(scrollTop > 50);

  setScrollProgress(
    Math.min(Math.max(progress, 0), 100)
  );
};

window.addEventListener(
  "scroll",
  handleScroll,
  { passive: true }
);

handleScroll();

return () => {
  window.removeEventListener(
    "scroll",
    handleScroll
  );
};


}, []);

/* SCROLL TO MANIFESTO */

const scrollToManifesto = () => {
document
.getElementById("manifesto")
?.scrollIntoView({
behavior: "smooth",
block: "start",
});
};

/* JOIN EMAIL LIST */

const handleNotify = async (e) => {
e.preventDefault();


const cleanEmail =
  email.trim().toLowerCase();

/* EMPTY EMAIL */

if (!cleanEmail) {
  setShowEmptyPopup(true);
  return;
}

/* EMAIL VALIDATION */

const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(cleanEmail)) {
  setShowInvalidPopup(true);
  return;
}

try {
  setIsSubmitting(true);
  setMessage("");

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5002";

  const response = await fetch(
    `${API_URL}/api/subscribe`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        email: cleanEmail,
      }),
    }
  );

  const data = await response.json();

  /* SUCCESS */

  if (response.ok && data.success) {
    setEmail("");
    setShowSuccessPopup(true);
    return;
  }

  /* DUPLICATE EMAIL */

  if (
    response.status === 409 ||
    data.message
      ?.toLowerCase()
      .includes("already")
  ) {
    setShowAlreadyPopup(true);
    return;
  }

  setMessage(
    data.message ||
      "SOMETHING WENT WRONG. TRY AGAIN."
  );
} catch (error) {
  console.error(
    "Subscriber Error:",
    error
  );

  setMessage(
    "SERVER ERROR. PLEASE TRY AGAIN."
  );
} finally {
  setIsSubmitting(false);
}


};

return (
<>
{/* SCROLL PROGRESS */}


  <div className="scroll-progress-container">
    <div
      className="scroll-progress-bar"
      style={{
        width: `${scrollProgress}%`,
      }}
    />
  </div>

  {/* SUCCESS POPUP */}

  {showSuccessPopup && (
    <div
      className="success-overlay"
      onClick={() =>
        setShowSuccessPopup(false)
      }
    >
      <div
        className="success-popup"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <button
          className="popup-close"
          onClick={() =>
            setShowSuccessPopup(false)
          }
          aria-label="Close popup"
        >
          ×
        </button>

        <div className="success-icon">
          ✦
        </div>

        <p className="popup-eyebrow">
          ACCESS GRANTED
        </p>

        <h2>
          YOU'RE
          <br />
          <span>IN.</span>
        </h2>

        <p className="popup-description">
          Welcome to the ROGUE list.
          <br />
          You'll be among the first to know
          when the new order begins.
        </p>

        <div className="popup-line" />

        <p className="popup-footer">
          NEVER MEANT TO FIT IN.
        </p>

        <button
          className="popup-button"
          onClick={() =>
            setShowSuccessPopup(false)
          }
        >
          ENTER ROGUE ↗
        </button>
      </div>
    </div>
  )}

  {/* ALREADY SUBSCRIBED POPUP */}

  {showAlreadyPopup && (
    <div
      className="success-overlay"
      onClick={() =>
        setShowAlreadyPopup(false)
      }
    >
      <div
        className="success-popup"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <button
          className="popup-close"
          onClick={() =>
            setShowAlreadyPopup(false)
          }
          aria-label="Close popup"
        >
          ×
        </button>

        <div className="success-icon">
          ◎
        </div>

        <p className="popup-eyebrow">
          ROGUE RECOGNIZES YOU
        </p>

        <h2>
          ALREADY
          <br />
          <span>IN.</span>
        </h2>

        <p className="popup-description">
          You're already part of the ROGUE list.
          <br />
          Stay ready. The first drop is coming.
        </p>

        <div className="popup-line" />

        <p className="popup-footer">
          NEVER MEANT TO FIT IN.
        </p>

        <button
          className="popup-button"
          onClick={() =>
            setShowAlreadyPopup(false)
          }
        >
          STAY ROGUE ↗
        </button>
      </div>
    </div>
  )}

  {/* EMPTY EMAIL POPUP */}

  {showEmptyPopup && (
    <div
      className="success-overlay"
      onClick={() =>
        setShowEmptyPopup(false)
      }
    >
      <div
        className="success-popup"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <button
          className="popup-close"
          onClick={() =>
            setShowEmptyPopup(false)
          }
        >
          ×
        </button>

        <div className="success-icon">
          !
        </div>

        <p className="popup-eyebrow">
          MISSING INFORMATION
        </p>

        <h2>
          ENTER
          <br />
          <span>EMAIL.</span>
        </h2>

        <p className="popup-description">
          Enter your email address to join
          the ROGUE list.
        </p>

        <button
          className="popup-button"
          onClick={() =>
            setShowEmptyPopup(false)
          }
        >
          GOT IT ↗
        </button>
      </div>
    </div>
  )}

  {/* INVALID EMAIL POPUP */}

  {showInvalidPopup && (
    <div
      className="success-overlay"
      onClick={() =>
        setShowInvalidPopup(false)
      }
    >
      <div
        className="success-popup"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <button
          className="popup-close"
          onClick={() =>
            setShowInvalidPopup(false)
          }
        >
          ×
        </button>

        <div className="success-icon">
          !
        </div>

        <p className="popup-eyebrow">
          INVALID FORMAT
        </p>

        <h2>
          CHECK
          <br />
          <span>EMAIL.</span>
        </h2>

        <p className="popup-description">
          Please enter a valid email address
          to access the ROGUE list.
        </p>

        <button
          className="popup-button"
          onClick={() =>
            setShowInvalidPopup(false)
          }
        >
          TRY AGAIN ↗
        </button>
      </div>
    </div>
  )}

  {/* LOADER */}

  <div
    className={`loader ${
      loaded ? "loader-hidden" : ""
    }`}
  >
    <img
      src="/ROGUE.png"
      alt="ROGUE"
      className="loader-logo"
    />

    <p>INITIALIZING ROGUE</p>
  </div>

  {/* MAIN */}

  <main
    className={`coming-soon ${
      loaded ? "page-visible" : ""
    }`}
  >
    {/* NAVBAR */}

    <nav
      className={`navbar ${
        scrolled ? "navbar-scrolled" : ""
      }`}
    >
      <div className="nav-brand">
        ROGUE
      </div>

      <div className="nav-center">
        NEVER MEANT TO FIT IN.
      </div>

      <div className="nav-status">
        <span className="status-dot" />
        LAUNCH SEQUENCE ACTIVE
      </div>
    </nav>

    {/* HERO */}

    <section className="hero-section">
      <div className="hero-grid" />

      <div className="hero-top">
        <span>01 / 01</span>
        <span>EST. MMXXVI</span>
        <span>INDIA</span>
      </div>

      <div className="hero-content">
        <p className="eyebrow">
          THE NEW ORDER IS COMING
        </p>

        <h1>
          NEVER MEANT
          <br />
          <span>TO FIT IN.</span>
        </h1>

        <p className="hero-description">
          For those who were never made
          <br />
          to blend into the ordinary.
        </p>
      </div>

      {/* COUNTDOWN */}

      <div className="countdown-section">
        <p className="countdown-label">
          TIME UNTIL LAUNCH
        </p>

        <div className="countdown">
          <div className="time-box">
            <span>{timeLeft.days}</span>
            <small>DAYS</small>
          </div>

          <div className="separator">:</div>

          <div className="time-box">
            <span>{timeLeft.hours}</span>
            <small>HOURS</small>
          </div>

          <div className="separator">:</div>

          <div className="time-box">
            <span>{timeLeft.minutes}</span>
            <small>MINUTES</small>
          </div>

          <div className="separator">:</div>

          <div className="time-box">
            <span>{timeLeft.seconds}</span>
            <small>SECONDS</small>
          </div>
        </div>

        <p className="launch-date">
          27 NOVEMBER 2026 — 12:00 AM IST
        </p>
      </div>

      {/* SCROLL */}

      <button
        className="scroll-indicator"
        onClick={scrollToManifesto}
        aria-label="Scroll to manifesto"
      >
        <span>SCROLL TO DISCOVER</span>
        <div className="scroll-line" />
      </button>
    </section>

    {/* ABOUT */}

    <section
      id="manifesto"
      className={`about-section reveal-section ${
        visibleSections.about
          ? "revealed"
          : ""
      }`}
      data-section="about"
    >
      <div className="section-number">
        <span>02</span>
        <div />
        <small>THE MANIFESTO</small>
      </div>

      <div className="about-content">
        <h2>
          BORN
          <br />
          <span>DIFFERENT.</span>
        </h2>

        <div className="about-text">
          <p>
            ROGUE exists for those who move
            differently.
          </p>

          <p>
            The ones who reject the predictable,
            challenge the ordinary and create
            their own direction.
          </p>

          <p className="about-highlight">
            NEVER MEANT TO FIT IN.
            <br />
            NEVER MADE TO FOLLOW.
          </p>
        </div>
      </div>
    </section>

    {/* STATEMENT */}

    <section
      className={`statement-section reveal-section ${
        visibleSections.statement
          ? "revealed"
          : ""
      }`}
      data-section="statement"
    >
      <div className="statement-symbol">
        ✦
      </div>

      <p>
        CLOTHING / STREETWEAR / LIFESTYLE
      </p>

      <h2>
        NOT MADE
        <br />
        TO FOLLOW.
      </h2>
    </section>

    {/* NOTIFY */}

    <section
      className={`notify-section reveal-section ${
        visibleSections.notify
          ? "revealed"
          : ""
      }`}
      data-section="notify"
    >
      <div className="notify-line" />

      <p className="eyebrow">
        ACCESS THE FIRST DROP
      </p>

      <h2>
        ENTER
        <br />
        <span>ROGUE.</span>
      </h2>

      <p className="notify-description">
        Be among the first to know when
        the new order begins.
      </p>

      <form
        className="email-form"
        onSubmit={handleNotify}
      >
        <input
          type="email"
          placeholder="YOUR EMAIL ADDRESS"
          value={email}
          disabled={isSubmitting}
          onChange={(e) => {
            setEmail(e.target.value);
            setMessage("");
          }}
        />

        <button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "JOINING..."
            : "JOIN THE LIST ↗"}
        </button>
      </form>

      {message && (
        <p className="form-message">
          {message}
        </p>
      )}
    </section>

    {/* FOOTER */}

    <footer>
      <div>© 2026 ROGUE</div>

      <div className="footer-center">
        NEVER MEANT TO FIT IN.
      </div>

      <div className="footer-right">
        EST. MMXXVI
      </div>
    </footer>
  </main>
  <Analytics />
</>


);
}

export default App;
