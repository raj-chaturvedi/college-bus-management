# College Bus Management System

> Real-time college transit telemetry, road-following bus tracking, dynamic ETAs, crowd analytics, and 5-minute digital boarding passes.

**Production Deployment:** [https://college-bus-management-etd3.vercel.app/](https://college-bus-management-etd3.vercel.app/)  
**Maintained by:** Raj Chaturvedi ([rajchaturvedi215@gmail.com](mailto:rajchaturvedi215@gmail.com))

---

## Overview

College Bus Management System is a transit web application built specifically for college campuses and commuter corridors in Greater Noida (covering Knowledge Park III, Pari Chowk, Sector 62 Link, Yamuna Expressway, Bennett University, and residential sectors).

Instead of relying on straight-line markers or static schedules, the system binds 16 active fleet buses to verified OpenStreetMap road routes (OSRM geometry), simulates real-time movement at realistic city transit speeds (18–24 km/h), dynamically estimates next-stop arrivals, flags real passenger crowd levels, and issues secure, time-limited digital QR boarding passes.

---

## Key Features

### 1. Live Road-Following Bus Tracking
- **Actual Road Geometry:** Buses follow verified OSRM road coordinates loaded from `routeRoadGeometries.json`. No straight-line shortcuts, no flying over campus buildings or teleporting between stops.
- **Realistic Speeds:** Fleet buses travel at realistic campus/city speeds of 18–24 km/h. Coordinates advance strictly by 1 road step per 3-second cycle (~15 meters).
- **Smooth Client Linear Interpolation:** Front-end markers interpolate positions using `requestAnimationFrame` over 2.8-second intervals, making movement appear smooth and natural on the map.
- **Dynamic Compass Heading:** Bus icons rotate in real-time to match the exact road segment bearing (`0°–360°`).
- **Telemetry Transparency:** Every bus card and map popup clearly distinguishes verified physical GPS from simulated road telemetry.

### 2. Vehicle Silhouette Markers & Live Crowd Colors
- **Navigation-Grade Vehicle Icons:** Replaced generic circular map pins with standalone top-down vehicle silhouettes modeled after real-time delivery and ride-tracking apps (like Zomato).
- **Integrated Identifier Plate:** Each bus marker carries a high-contrast rear license/number plate tag (e.g. `B-101`) directly on the vehicle chassis.
- **Dynamic Occupancy Colors:**
  - 🟢 **Green (< 50%):** Low Crowd / Seats Available
  - 🟡 **Amber (50% – 80%):** Moderate Crowd / Standing Room Limited
  - 🔴 **Red (> 80%):** High Crowd / Near Capacity
  - ⚪ **Slate (N/A):** Neutral / Telemetry Offline
- **Touch-Friendly Controls:** Hover or tap displays a lightweight Leaflet tooltip (`Bus Number • Crowd Status • Speed`), while clicking opens complete vehicle metadata and route details.

### 3. Mobile-First Commuter Experience (320px – 430px)
- **Zero Congested Clutter:** Replaced bulky, nested multi-card desktop views on mobile with a clean, single-layer layout designed for quick glances between classes.
- **Header:** Displays a personalized greeting, live clock, real-time "On Time" status indicator, and active bus count.
- **Next Journey Hero Card:** Prominent card highlighting the commuter's next ride, origin-to-destination corridor, live arrival countdown, bus plate, and an instant "Issue Digital Pass" action.
- **Quick Action Bar:** 4 one-tap actions for Live Map, My Pass, Bus AI Assistant, and Incident Reporting.
- **Clean Route Planner:** Streamlined origin/destination selects with one-tap swap, quick preference pills (`Balanced`, `Fastest`, `Shortest`, `Least Crowded`), and clean result cards.
- **Modal Scroll-Lock:** Fixed mobile dialog scroll bleed in the Digital Pass and AI Assistant modals using `position: fixed` scroll restoration and `overscroll-behavior: contain`.

### 4. 5-Minute Digital Boarding Pass
- **Server-Authoritative Expiry:** Passes expire exactly 5 minutes after creation (`expiresAt = createdAt + 5 minutes`). Expiration is calculated and verified server-side to prevent device clock tampering.
- **Live Visual Countdown:** Front-end pass displays a live 1-second countdown timer. Once expired, the QR code dims, a clear expired badge appears, and the pass is disabled.
- **Single-Use QR Validation:** The QR scanner endpoint validates pass legitimacy against database records and marks the pass as `USED` on successful scan to prevent reuse.
- **Anti-Fraud Security:** Expired or already consumed passes are rejected with `400 Bad Request`.

### 5. Account Security & Verification
- **Username Standards:** 4–20 characters, alphanumeric with underscores (`/^[a-zA-Z0-9_]+$/`), cannot start with an underscore, normalized to lowercase, and enforced unique in the database.
- **Strong Password Rules:** Minimum 10 characters requiring uppercase, lowercase, numbers, and special characters (`!@#$%^&*...`). Blocks common weak passwords.
- **Email Verification Flow:** New accounts are created in a pending/unverified state. The server generates a time-limited (15-minute) 6-digit OTP and 32-byte secure token sent via Gmail SMTP or HTTPS relay.
- **Access Gating:** Unverified accounts are prevented from accessing protected student or admin transit features (`403 Forbidden`).
- **Rate Limiting:** Sliding-window rate limiters protect registration (5/hr), login attempts (10/15m), and email verification requests (5/15m).
- **Google OAuth 2.0:** One-tap sign-in with verified Google accounts is preserved and fully supported.

### 6. Grounded AI Transit Assistant (Google Gemini)
- Integrated Google Gemini conversational assistant answering natural language questions about bus arrivals, crowd levels, and optimal routes.
- Feeds live fleet telemetry directly into the context window to prevent AI hallucinations.
- Features automatic fallback to local rule-based intelligence when offline or without an API key.

---

## Transit Network Corridors (Greater Noida)

The platform models 26 verified campus & regional transit stops across 6 major Greater Noida corridors:

| Route Code | Route Name | Coverage & Highlights | Frequency | Fleet Units |
| :--- | :--- | :--- | :--- | :--- |
| **ROUTE-101** | **KP-3 University Express** | Sharda University ↔ GL Bajaj ↔ Pari Chowk ↔ Jagat Farm Commercial Hub | Every 8 mins | Bus 12, Bus 3, Bus 5 |
| **ROUTE-102** | **Sector 62 - Gr. Noida West** | Noida Sector 62 Link ↔ Gaur City ↔ Pari Chowk ↔ Knowledge Park III | Every 12 mins | Bus 4, UPSRTC 102 |
| **ROUTE-103** | **Aqua Line Metro Orbit** | KP-2 Metro Station ↔ Jagat Farm ↔ City Park ↔ Delta 1 Metro | Every 10 mins | NMRC Feeder 9, Bus 8 |
| **ROUTE-104** | **Yamuna Expressway Shuttle** | Zero Point ↔ Gautam Buddha University (GBU) ↔ Galgotias University ↔ Kasna | Every 15 mins | Bus 7, UPSRTC 104 |
| **ROUTE-105** | **Bennett University Tech Link** | Bennett University Campus ↔ Wipro SEZ KP-4 ↔ Pari Chowk Terminal | Every 15 mins | Bus 11, StarLine 15 |
| **ROUTE-106** | **Delta - Gamma Residential Feeder** | Delta 2 ↔ Alpha 1 Commercial Belt ↔ Pari Chowk Interchange | Every 10 mins | Bus 16, CityShuttle 18 |

---

## Tech Stack

- **Frontend:** React 18, Vite 6, Tailwind CSS 3.4, React-Leaflet, Leaflet, Recharts, Lucide Icons, Axios
- **Backend:** Node.js (v18+), Express.js, JWT, bcryptjs, Nodemailer
- **Routing & Maps:** OpenStreetMap, OSRM Road Routing Engine, Leaflet
- **Database & Storage:** MongoDB / Mongoose with an automatic resilient in-memory/JSON fallback engine (`server/services/store.js`) for zero-dependency local development
- **AI Integration:** Google Gemini 1.5 Flash (`@google/generative-ai`)

---

## Project Structure

```text
college-bus-management/
├── client/                     # Vite + React Frontend
│   ├── public/                 # Static assets & icons
│   └── src/
│       ├── components/
│       │   ├── ai/             # Gemini AI Assistant drawer & quick prompts
│       │   ├── auth/           # Login, registration, & protected route wrappers
│       │   ├── common/         # DigitalPassModal, WhyThisRouteModal, StopBoard
│       │   └── map/            # TransitMap (Zomato-style vehicle markers, road layers)
│       ├── data/               # routeRoadGeometries.json (OSRM road coordinates)
│       ├── pages/              # DashboardPage, LoginPage, RegisterPage, AdminPage
│       └── services/           # api.js, roadRoutingService.js, geocodingService.js
├── server/                     # Express.js REST API
│   ├── controllers/            # authController, passController, transitController
│   ├── middleware/             # auth.js (JWT + verification gate), rateLimiter.js
│   ├── models/                 # User, Bus, Route, Stop, Pass, Incident (Mongoose)
│   ├── routes/                 # authRoutes, passRoutes, transitRoutes, aiRoutes
│   ├── scripts/                # testMasterRequirements.js, testEndpoints.js
│   └── services/               # store.js (dual DB/memory engine), simulationService.js
└── seed/                       # Database seed scripts for stops, routes, and fleet
```

---

## Getting Started

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (v9+)
- *Optional:* MongoDB running locally on `localhost:27017` (If MongoDB is offline, the backend automatically uses its resilient JSON/Memory store).

### 1. Installation
Clone the repository and install dependencies for both the backend and frontend:

```bash
# Clone the repository
git clone https://github.com/raj-chaturvedi/college-bus-management.git
cd college-bus-management

# Install server packages
cd server
npm install

# Install client packages
cd ../client
npm install
cd ..
```

### 2. Environment Setup
Create a `.env` file inside `server/`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/college_bus_ai
JWT_SECRET=college_bus_management_secure_jwt_secret_key_2026

# Optional: Live Google Gemini AI Key
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Live Gmail SMTP Dispatch
GMAIL_APP_USER=rajchaturvedi215@gmail.com
GMAIL_APP_PASS=your_gmail_app_password
```

Create a `.env` file inside `client/`:

```env
VITE_API_URL=http://localhost:5000/api
# Optional: Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### 3. Seed Database
Initialize the 26 Greater Noida stops, 6 transit corridors, 16 buses, and default accounts:

```bash
node seed/seed.js
```

### 4. Running Locally
Run the server and client concurrently in two terminal tabs:

**Terminal 1 (Backend API):**
```bash
node server/server.js
# Backend listening on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Frontend live at http://localhost:5173
```

---

## Verification & Automated Tests

The repository includes comprehensive automated test suites covering all security, routing, pass validity, and API endpoints:

```bash
# Run Master Requirements Verification (6 core security & telemetry domains)
node server/scripts/testMasterRequirements.js

# Run API Integration & Endpoint Suite (7/7 tests)
node server/scripts/testEndpoints.js

# Validate Frontend Production Build
npm --prefix client run build
```

---

## Demo Accounts

Pre-seeded accounts are available for testing with 1-click quick-fill buttons on the login screen:

| Role | Username | Email | Password | Name |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | `rajchaturvedi` | `rajchaturvedi215@gmail.com` | `student123` | Raj Chaturvedi |
| **Student** | `student` | `student@college.edu` | `student123` | Alex Rivera |
| **Student** | `priyasharma` | `priya.sharma@gmail.com` | `student123` | Priya Sharma |
| **Admin** | `admin` | `admin@college.edu` | `admin123` | Dr. Marcus Vance |

---

## API Summary

- `POST /api/auth/register` — User registration with username format validation & initial unverified state
- `POST /api/auth/verify-email` — Verify account using 6-digit OTP or link token
- `POST /api/auth/resend-verification` — Request new verification code (rate limited)
- `POST /api/auth/login` — Sign in via Username or Email + Password
- `POST /api/auth/google` — Google OAuth 2.0 authentication
- `POST /api/passes/generate` — Generate 5-minute digital boarding pass
- `POST /api/passes/verify` — Server-side QR scanner pass validation & single-use redemption
- `GET /api/buses/live` — 3-second live road telemetry with headings and occupancy
- `POST /api/recommendations` — Multi-criteria route recommendation engine
- `POST /api/ai/chat` — Context-grounded Gemini AI transit chatbot

---

## License

This project is licensed under the [MIT License](LICENSE).
