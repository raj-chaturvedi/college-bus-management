# College Bus Management System with AI Route Recommendation

[![Node.js](https://img.shields.io/badge/Node.js-v24.19.0-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.1-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-10b981.svg)](https://leafletjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-emerald.svg)](https://www.mongodb.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%201.5-orange.svg)](https://ai.google.dev/)

---

## 1. Project Title & Vision
**College Bus Management System with AI Route Recommendation** is a production-quality, intelligent campus transportation and transit optimization platform. It bridges deterministic graph algorithms (Dijkstra's shortest/optimal path) with real-time GPS telemetry, personalized commuter preference scoring, historical crowd prediction, fleet reliability tracking, and Google Gemini conversational transit assistance.

---

## 2. Problem Statement
Campus transit across large universities, collegiate clusters, and metropolitan feeder lines often faces severe operational bottlenecks:
- Students experience uncertainty about bus arrival times, overcrowding, and unpredictable delays.
- Commuters lack personalized guidance (e.g. students with walking limitations or those prioritizing comfortable seating over sheer speed).
- Campus transportation administrators struggle with fragmented telemetry, lack of real-time passenger crowd visibility, and poor route optimization data.

---

## 3. Project Objectives
1. **Intelligent Route Optimization:** Represent campus stops and corridors as a directed graph and calculate candidate paths using Dijkstra's algorithm.
2. **Personalized Multi-Criteria Scoring:** Rank candidate routes on a normalized 0–100 scale based on travel time, walking distance, boarding wait, crowd level, transfers, and reliability.
3. **Simulated Real-Time GPS Tracking:** Provide live bus movement along route coordinates on interactive OpenStreetMap (Leaflet) without paid map APIs.
4. **Historical Crowd Prediction:** Project expected passenger occupancy levels for upcoming peak hours.
5. **Route Reliability Analytics:** Track delays, cancellations, and on-time percentages across all transit lines.
6. **Conversational AI Assistance:** Integrate Google Gemini AI to answer transit queries and explain recommendation rationale without inventing false numbers.
7. **Comprehensive Administrative Command Center:** Enable transport officers to manage fleet units, routes, stops, licensed drivers, and view rich charts.

---

## 4. Key Features

### For Students
- **Smart Route Finder:** Find optimal bus connections between any two stops with instant ranking (Best Match, Alternative 1, Alternative 2).
- **"Why This Route?" Explanation:** Detailed modal showing exact metric score breakdowns and human-readable justification grounded in real telemetry.
- **"What If?" Route Optimizer:** Interactive panel enabling commuters to switch between `BALANCED`, `FASTEST`, `LEAST_WALKING`, `LEAST_CROWDED`, `NO_TRANSFERS`, `LEAST_WAITING`, and `MOST_RELIABLE` with dynamic re-ranking.
- **Interactive Live Map:** Leaflet map featuring real-time moving bus markers, heading orientation, route polylines, and stop markers.
- **Gemini AI Transit Assistant:** Context-grounded conversational chatbot answering queries about crowds, schedules, and delays.
- **Smart & Personalized Alerts:** Notifications for high crowd density, delays, and approaching stops tailored to student favorites.
- **Favorites & Search History:** Save daily commutes and re-run historical searches with one click.
- **Personalized Preference Matrix:** Configure sensitivity sliders for walking meters, waiting minutes, and priority weights.

### For Administrators
- **Executive KPI Dashboard:** 8 real-time indicators (Total Fleet, Active Buses, Students, Routes, Avg Occupancy, Peak Hour, Delay, Reliability).
- **Interactive Analytics (Recharts):**
  - Average Fleet Occupancy by Hour (Area chart)
  - Student Route Searches by Hour (Bar chart)
  - Bus Volume & Utilization Rates (Bar chart)
  - Route Punctuality & Reliability Index (Bar chart)
- **Bus Fleet Management:** Add, edit, delete buses, update capacity, and adjust live passenger counts.
- **Route & Corridor Management:** Define multi-stop routes, schedules, frequency, and colors.
- **Stop Station Management:** Create stops with GPS coordinates and campus zone allocations.
- **Driver Registry:** Maintain driver phone, license, safety rating, and bus assignments.
- **User Account Security:** View registered students and toggle account activation.

---

## 5. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS, React Router v6, Axios, Leaflet, React-Leaflet, Recharts, Lucide React |
| **Backend** | Node.js v24, Express.js, JWT, bcryptjs, Mongoose, CORS, Dotenv |
| **Database** | MongoDB (with automatic high-performance resilient Memory/JSON Store fallback) |
| **AI Integration** | Google Gemini 1.5 Flash via `@google/generative-ai` with Grounded Telemetry Ingestion |
| **Algorithms** | Dijkstra's Graph Search, Haversine Distance Formula, Multi-Criteria Weighted Scoring |

---

## 6. System Architecture

```mermaid
graph TD
    A[Student / Admin Browser] -->|HTTP / JSON REST API| B[Express.js Server]
    B -->|Authentication & JWT| C[Auth Controller & Middleware]
    B -->|Route Optimization| D[Dijkstra Graph Router]
    D -->|Candidate Evaluation| E[Multi-Criteria Recommendation Engine]
    B -->|Telemetry Simulation| F[Live GPS Simulation Engine (3s Step)]
    B -->|Transit Context Grounding| G[Google Gemini AI Assistant]
    B -->|Data Persistence| H[(MongoDB / Mongoose / Store)]
    H -->|Models| I[Buses, Routes, Stops, Drivers, Users, Trips, Favorites]
```

---

## 7. Database Models (Mongoose)

1. **User:** `name`, `email`, `password`, `role` (`student` \| `admin`), `preferences` (mode, priorities, thresholds), `favoriteRoutes`, `favoriteBuses`, `isActive`.
2. **Bus:** `busNumber`, `plateNumber`, `capacity`, `currentPassengers`, `currentLocation` (`lat`, `lng`, `heading`, `speed`), `route`, `driver`, `status`, `currentStopIndex`, `nextStopEtaMinutes`, `delayMinutes`, `direction`.
3. **Route:** `name`, `code`, `description`, `color`, `stops` (ordered stop references with scheduled minutes from start), `distance`, `estimatedTime`, `buses`, `frequencyMinutes`.
4. **Stop:** `name`, `code`, `latitude`, `longitude`, `zone`, `isActive`.
5. **Driver:** `name`, `phone`, `licenseNumber`, `assignedBus`, `experienceYears`, `safetyRating`.
6. **Trip:** `student`, `source`, `destination`, `bus`, `route`, `travelTime`, `walkingDistance`, `status`, `timestamp`.
7. **Favorite:** `student`, `itemType` (`route` \| `bus` \| `destination`), `route`, `bus`, `destinationStop`, `label`.
8. **OccupancyRecord:** `bus`, `timestamp`, `passengerCount`, `occupancyPercentage`, `hourOfDay`, `dayOfWeek`.
9. **ReliabilityRecord:** `bus`, `route`, `delay`, `onTime`, `tripStatus`, `timestamp`.

---

## 8. Route Recommendation & Scoring Algorithm

Every candidate path between source stop $S$ and destination stop $D$ is evaluated across six normalized metrics ($0$ to $100$):

$$\text{RouteScore} = w_{\text{travel}} \cdot S_{\text{travel}} + w_{\text{walk}} \cdot S_{\text{walk}} + w_{\text{wait}} \cdot S_{\text{wait}} + w_{\text{crowd}} \cdot S_{\text{crowd}} + w_{\text{transfer}} \cdot S_{\text{transfer}} + w_{\text{rel}} \cdot S_{\text{rel}}$$

### Configurable Weights by Mode:
- **BALANCED:** Travel (0.30), Crowd (0.20), Walking (0.15), Waiting (0.15), Transfer (0.10), Reliability (0.10)
- **FASTEST:** Travel (0.50), Waiting (0.20), Walking (0.10), Crowd (0.10), Transfer (0.05), Reliability (0.05)
- **LEAST_WALKING:** Walking (0.45), Travel (0.20), Crowd (0.15), Waiting (0.10), Reliability (0.05), Transfer (0.05)
- **LEAST_CROWDED:** Crowd (0.45), Travel (0.20), Waiting (0.15), Reliability (0.10), Walking (0.05), Transfer (0.05)
- **NO_TRANSFERS:** Transfer (0.40), Travel (0.20), Waiting (0.15), Crowd (0.15), Walking (0.05), Reliability (0.05)
- **LEAST_WAITING:** Waiting (0.45), Travel (0.20), Crowd (0.15), Reliability (0.10), Walking (0.05), Transfer (0.05)
- **MOST_RELIABLE:** Reliability (0.45), Travel (0.20), Waiting (0.15), Crowd (0.10), Walking (0.05), Transfer (0.05)

---

## 9. AI Integration (Google Gemini)
- **Ground Truth Context:** The backend serializes the current active telemetry snapshot of buses, stops, occupancy rates, and delays into the system prompt.
- **Hallucination Prevention:** Gemini is strictly instructed never to fabricate non-existent bus numbers, departure times, or routes.
- **Smart Engine Fallback:** If `GEMINI_API_KEY` is not provided in `.env`, the built-in Transit Intelligence Engine automatically parses student queries and generates verified responses from real database state.

---

## 10. Quickstart & Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB running locally on `localhost:27017` (or MongoDB Atlas connection string). *Note: The system also includes an automatic memory fallback if MongoDB daemon is inactive.*

### 1. Clone & Setup
```bash
git clone <repository_url>
cd college-bus-ai
```

### 2. Install Server & Client Dependencies
```bash
# Server packages
cd server
npm install

# Client packages
cd ../client
npm install
```

### 3. Configure Environment Variables
In `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/college_bus_ai
JWT_SECRET=college_bus_ai_super_secure_jwt_token_secret_key_2026
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Seed the Database
```bash
# From workspace root
node seed/seed.js
```
*Creates 8 buses, 20 stops, 6 routes, 8 drivers, sample trips, occupancy, and demo accounts.*

### 5. Start the Application
In Terminal 1 (Backend):
```bash
node server/server.js
```

In Terminal 2 (Frontend):
```bash
cd client
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 11. Demo Accounts & Authentication

The system supports **Universal Identifier Authentication**: commuters can log in using either their unique **Username** or their **Email address**.

| Role | Username | Email | Password | Name |
|---|---|---|---|---|
| **Student** | `student` | `student@college.edu` | `student123` | Alex Rivera |
| **Student** | `rajchaturvedi` | `rajchaturvedi215@gmail.com` | `student123` | Raj Chaturvedi |
| **Student** | `priyasharma` | `priya.sharma@gmail.com` | `student123` | Priya Sharma |
| **Admin** | `admin` | `admin@college.edu` | `admin123` | Dr. Marcus Vance |

*(1-Click quick fill buttons are available directly on the login page for immediate testing!)*

---

## 12. Multimodal Transit Fleet (College, Government & Private)

The transit network models real-world Greater Noida regional transport across three operational tiers:

1. **College Campus Fleet (8 Buses):** Dedicated institution shuttles (`Bus 12`, `Bus 4`, `Bus 3`, etc.) connecting campuses and metros with 100% subsidized (₹0.00) student transit passes.
2. **Government State Transport (4 Buses):** `UPSRTC City Bus 102`, `NMRC Aqua Metro Feeder 9`, `UPSRTC Express 104`, and `NMRC Feeder 20` connecting major sector arteries and metro terminals with standard state fares (₹15–₹30).
3. **Private Charters & Express Lines (4 Buses):** `StarLine Pvt Shuttle 15`, `CityShuttle Pvt Express 18`, `FastTrack Pvt 14`, and `Metro CityLink 25` providing high-frequency commercial commuter connections (₹20–₹35).

---

## 13. Google OAuth 2.0 Setup Guide

To enable live Google Sign-In with real Google accounts:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) &rarr; **APIs & Services** &rarr; **Credentials**.
2. Click **Create Credentials** &rarr; **OAuth client ID**.
3. Choose **Application type:** *Web application*.
4. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (Local Vite dev server)
   - `http://127.0.0.1:5173`
5. Click **Create** and copy your **Client ID**.
6. Set the Client ID in your environment configuration:
   - In `client/.env`: `VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com`
   - In `server/.env`: `GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com`
7. Restart the servers. Clicking **Continue with Google** will automatically open the official Google account chooser popup.

---

## 14. REST API Documentation

### Authentication & Commuters
- `POST /api/auth/register` — Create account with **Username** and **Password** (email strictly not required)
- `POST /api/auth/login` — Sign in with **Username** or **Email** + Password
- `POST /api/auth/google` — Authenticate via verified Google OAuth credential token
- `POST /api/auth/forgot-password` — Password recovery (provides in-person verification guidance for username-only accounts)
- `POST /api/auth/reset-password` — Set new password using token and verify account
- `GET /api/auth/me` — Current user profile
- `PUT /api/auth/preferences` — Update commute preference weights

### Recommendations & Routing
- `POST /api/recommendations` — Compute Dijkstra candidates and multi-criteria ranked routes

### Telemetry & Fleet
- `GET /api/buses` — List all buses (with `busType`, `operatorName`, and `fare`)
- `GET /api/buses/live` — Real-time GPS coordinates, heading, speed, and occupancy
- `POST /api/buses` — Add bus (Admin)
- `PUT /api/buses/:id` — Update bus (Admin)
- `PUT /api/buses/:id/occupancy` — Update passenger count (Admin)
- `DELETE /api/buses/:id` — Remove bus (Admin)

### Corridors & Stops
- `GET /api/routes` — Get routes with ordered stops sequence
- `GET /api/stops` — Get all 21 Greater Noida campus & sector stops with coordinates


### AI Assistant & Alerts
- `POST /api/ai/chat` — Conversational inquiries with grounded transit context
- `GET /api/alerts` — Real-time smart delay and crowd alerts
- `GET /api/analytics` — Admin fleet metrics and Recharts distributions (Admin)

---

## 13. Future-Ready Architecture
- **IoT GPS Hardware Gateway:** Ready to ingest real vehicle MQTT/WebSocket location feeds.
- **Mobile PWA:** Progressive Web App manifest for offline schedules and instant push notifications.
- **QR Code Boarding Pass:** Fast biometric or student ID card validation.
- **TensorFlow / ML Crowd Predictor:** Ingest seasonal term dates and exam schedules for long-range predictive dispatch.
