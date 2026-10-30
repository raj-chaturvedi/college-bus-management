# College Bus Management System (GNTA Transit Platform)

> **Enterprise-Grade Smart Campus Transit & Telemetry Management System**  
> Real-time road-following bus tracking, 60 FPS GPU-accelerated Leaflet maps, dynamic ETAs, crowd analytics, 5-minute single-use digital boarding tokens, and multi-channel notification relays for Greater Noida university corridors.

[![Production Deployment](https://img.shields.io/badge/Production-Live%20on%20Vercel-0284c7?style=for-the-badge&logo=vercel)](https://college-bus-management-etd3.vercel.app/)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary%20%26%20All%20Rights%20Reserved-dc2626?style=for-the-badge)](README.md#intellectual-property--legal-protection)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%206-61dafb?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Google Gemini](https://img.shields.io/badge/AI%20Assistant-Google%20Gemini%201.5%20Flash-4285f4?style=for-the-badge&logo=google)](https://ai.google.dev/)

**Live Production URL:** [https://college-bus-management-etd3.vercel.app/](https://college-bus-management-etd3.vercel.app/)  
**Platform Architect & Owner:** **Raj Chaturvedi** ([rajchaturvedi215@gmail.com](mailto:rajchaturvedi215@gmail.com))

---

### 🌐 Live Portal Access & Evaluation

For portfolio evaluators, recruiters, and transit testing:
- **Instant Google One-Tap:** Use the **"Continue with Google"** option on the [Sign In Page](https://college-bus-management-etd3.vercel.app/login) to access the commuter dashboard immediately.
- **Commuter Registration:** New commuters can register with an institutional or personal email address via the **"Create an account"** flow and complete the 6-digit OTP email verification.
- **Enterprise Credential Security:** In strict adherence to security best practices, live administrative credentials are not published in public documentation. Technical reviewers requiring elevated administrative access can request evaluation access directly from the platform author.

---

> [!CAUTION]
> ### PROPRIETARY & CONFIDENTIAL INTELLECTUAL PROPERTY — ALL RIGHTS RESERVED
> **Copyright &copy; 2026 Raj Chaturvedi. All rights reserved.**  
> This software codebase, proprietary routing algorithms, real-time GPS telemetry engine, hardware-accelerated mapping pipelines, security protocols, and digital pass verification systems are the exclusive intellectual property of **Raj Chaturvedi**.  
> **Strict Legal Warning:** Unauthorized copying, cloning, reverse-engineering, redistribution, resale, commercial deployment, or scamming is strictly prohibited by law. Violations will be met with immediate civil litigation and criminal prosecution under the **Indian Copyright Act, 1957**, the **Information Technology Act, 2000**, and the **Digital Millennium Copyright Act (DMCA)**. Access is granted solely for read-only portfolio evaluation.

---

## Executive Summary

The **College Bus Management System** is a next-generation transit management and commuter navigation ecosystem engineered specifically for college campuses and higher-education transit corridors in **Greater Noida, Uttar Pradesh** (connecting Knowledge Park III, Pari Chowk Interchange, Sharda University, GL Bajaj Institute, Gautam Buddha University, Bennett University, Galgotias University, and the Sector 62 transit corridor).

Traditional college transport portals rely on static PDF time tables or primitive straight-line map pins that jump across campus buildings. This platform revolutionizes student transit by implementing **true road-geometry telemetry (OSRM)**, **60 FPS mobile-optimized vector rendering**, **AI-grounded journey recommendations**, **5-minute single-use anti-fraud boarding tokens**, and **resilient dual-relay notification delivery**.

---

## Architectural Highlights & Core Systems

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           COMMUTER INTERFACE & DASHBOARD                        │
│   (Vite + React 18, Tailwind CSS, 2-Segment Control, Dynamic IST Live Clock)   │
└───────────────┬─────────────────────────────────┬───────────────────────────────┘
                │                                 │
                ▼                                 ▼
┌────────────────────────────────┐ ┌──────────────────────────────────────────────┐
│     LEAFLET 60 FPS TRANSIT MAP  │ │         DIGITAL BOARDING PASS ENGINE         │
│ • Hardware-Accelerated Canvas  │ │ • Stop Select Dropdowns (No Manual Typing)   │
│ • Direct Leaflet SetLatLng     │ │ • 5-Minute Server-Enforced Token Validity    │
│ • Realistic Commercial Bus SVG │ │ • Single-Use Scannable QR Verification       │
│ • Touch Inertia & Tile Caching │ │ • Dual Gmail SMTP & Vercel Relay Delivery    │
└────────────────────────────────┘ └──────────────────────────────────────────────┘
                │                                 │
                └────────────────┬────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               EXPRESS REST API BACKEND                          │
│   (Node.js, JWT Authentication, Crypto Reset Tokens, Dual Memory/MongoDB Store) │
└───────────────┬─────────────────────────────────┬───────────────────────────────┘
                │                                 │
                ▼                                 ▼
┌────────────────────────────────┐ ┌──────────────────────────────────────────────┐
│  AI TRANSIT ASSISTANT (GEMINI) │ │       ROAD-ROUTING & SIMULATION ENGINE       │
│ • Google Gemini 1.5 Flash      │ │ • OSRM Real Road Geometry Navigation         │
│ • Live Context Telemetry Feed  │ │ • 18–24 km/h Realistic Speed Interpolation   │
│ • Offline Heuristic Fallback   │ │ • Dynamic 0°–360° Compass Segment Bearings   │
└────────────────────────────────┘ └──────────────────────────────────────────────┘
```

---

## Detailed Feature Breakdown

### 1. 60 FPS Mobile-Optimized Interactive Transit Map
- **Hardware-Accelerated HTML5 Canvas (`preferCanvas: true`):** All multi-segment road corridors, walking paths, and route casings are rendered directly onto an accelerated canvas layer, eliminating heavy SVG DOM trees that cause mobile lag.
- **Zero-Overhead Direct Native Marker Updates:** Fixed mobile animation stutters by updating vehicle coordinates directly via Leaflet's native `marker.setLatLng()` API. This bypassed over **~960 React component state re-renders per second** across the 16 active fleet buses.
- **Butter-Smooth Gesture Zoom & Pan:**
  - `updateWhenZooming={false}`: Prevents main-thread tile calculation thrashing during pinch-to-zoom gestures.
  - `updateWhenIdle={true}` & `keepBuffer={6}`: Retains surrounding map tiles in memory so panning left, right, up, or down never encounters blank grey flashing tiles.
  - GPU compositing enforced via `touch-action: pan-x pan-y pinch-zoom`, `transform: translate3d(0,0,0)`, and `will-change: transform`.
- **Realistic Commercial Transit Bus Marker:** Standalone top-down coach silhouette featuring twin headlights, side mirrors, rooftop air-conditioning units, commuter windows, real-time directional compass rotation (`0°–360°`), and a high-contrast `BUS • GNTA` vehicle license plate.
- **Live Occupancy & Crowd Badges:**
  - 🟢 **Green (<50%):** Low Crowd &bull; Seats Available
  - 🟡 **Amber (50%–80%):** Moderate Crowd &bull; Standing Room Only
  - 🔴 **Red (>80%):** High Crowd &bull; Boarding At Capacity
  - ⚪ **Slate (N/A):** Telemetry Neutral

### 2. Digital Boarding Token System (GNTA Pass)
- **Stop Selection Dropdowns:** Replaced tedious free-form text typing with clean, searchable `<select>` dropdowns for both **Boarding Stop** and **Drop-off / Interchange Stop** containing all 26 official Greater Noida transit hubs.
- **One-Tap Swap Feature:** Instant "Swap Stops" button to quickly reverse origin and destination stops for return commuters.
- **Server-Authoritative 5-Minute Validity:** Passes are strictly valid for exactly 300 seconds (`expiresAt = createdAt + 5 minutes`). Device clock tampering is completely neutralized by server-side timestamp validation.
- **Dynamic In-App QR Code:** Automatically generates a high-density, scannable QR token resolving to `/verify-pass/:token`. Once the 5-minute window elapses, the pass automatically marks itself expired and disables scan verification.
- **Dual-Delivery Email Notification Relay:** Newly generated pass tokens are dispatched to the commuter's email address via Gmail SMTP and a dedicated HTTPS Vercel Lambda relay (`/api/email-relay`), complete with Indian Standard Time (IST) timestamps and security notices.
- **Conductor / Staff QR Scanner Modal:** Integrated camera-based QR code scanner allowing transit conductors to validate passenger tokens on boarding and burn single-use tokens to prevent duplicate reuse.

### 3. Mobile Commuter Dashboard UX
- **2-Segment Control Navigation:** Sleek mobile tab controller (`[Live Fleet Map]` vs `[Find Route]`) that eliminates vertical screen congestion and allows students to instantly switch between live GPS tracking and trip planning.
- **Live Indian Standard Time (IST) Real-Time Clock:** Displays seconds-accurate live time alongside a 3-second telemetry sync countdown badge.
- **Live Departure Board Modal:** One-tap inspection on any transit stop to see scheduled departures, oncoming buses, and estimated arrival times (ETAs).
- **Incident & Emergency SOS Dispatch:** Immediate access to emergency security contacts, campus control room dispatch, and driver incident reporting.

### 4. Advanced Authentication & Account Protection
- **Google OAuth 2.0 Identity Federation:** Native Google Identity integration (`@react-oauth/google`) with cryptographic ID token validation and automatic commuter onboarding.
- **Strict Username Sanitation:** 4–20 characters, alphanumeric with underscores (`/^[a-zA-Z0-9_]+$/`), normalized to lowercase, preventing whitespace injection or spoofing.
- **Enterprise-Grade Password Rules:** Minimum 10 characters requiring uppercase, lowercase, numbers, and special symbols (`!@#$%^&*`). Enforces rejection of common passwords and user-attribute inclusion to neutralize credential-stuffing and dictionary attacks.
- **6-Digit Email Verification Flow:** Account registration issues a 15-minute 6-digit OTP code delivered via dual SMTP / HTTPS relay with a 10-second timeout guarantee.
- **Password Reset Token System:** Generates cryptographically secure 32-byte hex reset tokens sent to verified commuter email inboxes, displayed in a high-visibility security box.
- **Sliding-Window Rate Limiting:** In-memory sliding rate limiters safeguarding login endpoints (10 attempts / 15 mins), registration (5 accounts / hr), and OTP verification resends.
- **Zero Static Credential Exposure:** Production deployments adhere to OWASP guidelines; credentials and secrets are injected via secure environment variables rather than hardcoded in public repository markdown.

### 5. Grounded AI Transit Assistant (Google Gemini 1.5 Flash)
- Seamless slide-over AI assistant drawer providing instant answers on transit timings, least crowded routes, and delay alerts.
- Injects live fleet positions, occupancy rates, and active road conditions directly into Gemini's context window to prevent hallucinated advice.
- Intelligent local fallback intelligence ensures the chatbot continues functioning even if internet connectivity or API quotas are offline.

---

## Greater Noida Transit Corridors

The platform models 26 high-traffic campus and regional transit stops across 6 primary transit corridors:

| Route Code | Route Corridor Name | Key Stops & Highlights | Peak Headway | Assigned Fleet Units |
| :--- | :--- | :--- | :--- | :--- |
| **ROUTE-101** | **KP-3 University Express** | Sharda University ↔ GL Bajaj ↔ Pari Chowk ↔ Jagat Farm Hub | Every 8 mins | Bus 12, Bus 3, Bus 5 |
| **ROUTE-102** | **Sector 62 - Gr. Noida West** | Noida Sector 62 Link ↔ Gaur City ↔ Surajpur ↔ KP-3 | Every 12 mins | Bus 4, UPSRTC 102 |
| **ROUTE-103** | **Aqua Line Metro Orbit** | KP-2 Metro Station ↔ Jagat Farm ↔ City Park ↔ Delta 1 Metro | Every 10 mins | NMRC Feeder 9, Bus 8 |
| **ROUTE-104** | **Yamuna Expressway Shuttle** | Zero Point ↔ Gautam Buddha University (GBU) ↔ Galgotias Univ. ↔ Kasna | Every 15 mins | Bus 7, UPSRTC 104 |
| **ROUTE-105** | **Bennett University Tech Link** | Bennett University ↔ Wipro Knowledge Park IV ↔ Pari Chowk | Every 15 mins | Bus 11, StarLine 15 |
| **ROUTE-106** | **Delta - Gamma Residential Feeder** | Delta 2 ↔ Alpha 1 Commercial Belt ↔ Pari Chowk Interchange | Every 10 mins | Bus 16, CityShuttle 18 |

---

## Technology Stack

| Domain | Technology / Library | Role & Implementation |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 18** (Vite 6) | Core single-page application with modular component architecture |
| **Styling & Design** | **Tailwind CSS 3.4** | Modern responsive design system, dark mode, glassmorphism UI |
| **Mapping Engine** | **Leaflet 1.9 & React-Leaflet** | Hardware-accelerated map rendering, canvas polylines, custom markers |
| **Backend Runtime** | **Node.js 18+ & Express.js** | High-performance RESTful API, middleware pipeline, JWT security |
| **Routing Intelligence**| **OSRM Engine** | Real road coordinate navigation loaded from `routeRoadGeometries.json` |
| **Data & Persistence** | **Dual Memory & Mongoose Engine**| MongoDB support with automatic JSON/Memory storage fallback |
| **AI Integration** | **Google Gemini 1.5 Flash** | Context-grounded commuter intelligence and natural language routing |
| **QR Code Engine** | **QRCode & jsQR** | Real-time QR generation and camera-based ticket validation |
| **Email Infrastructure**| **Nodemailer & HTTPS Relay** | Dual-channel transactional email dispatch (Gmail SMTP + Vercel Serverless) |

---

## Directory Architecture

```text
college-bus-management/
├── client/                     # Vite + React Frontend Client
│   ├── api/                    # Vercel serverless relay endpoints (email-relay.js)
│   ├── public/                 # Static assets, branding logos, PWA manifests
│   └── src/
│       ├── components/
│       │   ├── ai/             # Gemini AI transit assistant drawer & prompt pills
│       │   ├── auth/           # Login, registration, password reset & route guards
│       │   ├── common/         # DigitalPassModal, DepartureBoard, QrScannerModal
│       │   └── map/            # 60 FPS TransitMap, top-down bus silhouettes, stops
│       ├── context/            # AuthContext (JWT session), ThemeContext (dark/light)
│       ├── data/               # routeRoadGeometries.json (OSRM verified coordinates)
│       ├── pages/              # DashboardPage, LoginPage, RegisterPage, AdminDashboard
│       ├── services/           # api.js, roadRoutingService.js, geocodingService.js
│       └── utils/              # Audio feedback, notification permissions, scroll locks
├── server/                     # Node.js + Express API Backend
│   ├── controllers/            # authController, passController, transitController, services
│   ├── middleware/             # auth.js (JWT validation), rateLimiter.js
│   ├── models/                 # User, Bus, Route, Stop, Pass, Incident (Mongoose)
│   ├── routes/                 # authRoutes, passRoutes, transitRoutes, stopRoutes, aiRoutes
│   ├── scripts/                # testMasterRequirements.js, testEndpoints.js
│   └── services/               # store.js (resilient dual storage), emailService.js
└── seed/                       # Complete Greater Noida stops & fleet initialization data
```

---

## Quickstart & Local Setup

### Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- *Optional:* MongoDB running locally on port `27017` (automatic JSON/Memory engine activates if MongoDB is offline)

### 1. Clone Repository
```bash
git clone https://github.com/raj-chaturvedi/college-bus-management.git
cd college-bus-management
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
cd ..
```

### 3. Environment Variables Configuration

Create `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/college_bus_ai
JWT_SECRET=college_bus_management_super_secure_jwt_secret_key_2026

# Optional: Google Gemini AI Key
GEMINI_API_KEY=your_gemini_api_key

# Optional: Live Gmail SMTP Dispatch
GMAIL_APP_USER=your_gmail_address@gmail.com
GMAIL_APP_PASS=your_gmail_app_password
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
# Optional: Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### 4. Database Seeding
Populate the database with the 26 Greater Noida stops, 6 bus routes, 16 buses, and default commuter accounts:
```bash
node seed/seed.js
```

### 5. Launch Development Servers

**Terminal 1 (Backend API):**
```bash
node server/server.js
# API listening at http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Frontend application live at http://localhost:5173
```

---

## Verification & Automated Test Suites

The repository is equipped with automated verification suites covering security, routing, API contracts, and pass validity:

```bash
# Run Master Requirements Verification (6 Core Security & Telemetry Domains)
node server/scripts/testMasterRequirements.js

# Run API Integration & Endpoint Suite (7/7 Core Tests)
node server/scripts/testEndpoints.js

# Verify Production Client Build
npm --prefix client run build
```

---

## Intellectual Property & Legal Protection

This software, its design assets, telemetry models, and documentation are **proprietary and confidential**. It is **NOT** open-source and is **NOT** released under the MIT License or any public permissive license.

- **Author & Copyright Holder:** **Raj Chaturvedi** ([rajchaturvedi215@gmail.com](mailto:rajchaturvedi215@gmail.com))
- **Terms of Inspection:** Access to this GitHub repository is granted strictly for personal, non-commercial portfolio evaluation, technical review, and academic assessment.
- **Prohibited Conduct:** Sublicensing, copying, white-labeling, reselling, redistributing, creating derivative works, or deploying this system for commercial or third-party operations without prior explicit written authorization from Raj Chaturvedi is strictly prohibited and constitutes copyright infringement.
- **Enforcement:** Infringements and unauthorized redistributions will trigger immediate DMCA takedown notices, repository removal, and formal legal action under the **Indian Copyright Act, 1957** and international copyright treaties.
