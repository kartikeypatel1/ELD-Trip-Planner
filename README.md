# 🚛 ELD Trip Planner

A full-stack **Electronic Logging Device (ELD) Trip Planner** built with **React + Django** that helps truck drivers plan long-distance trips while automatically generating **FMCSA-compliant Hours of Service (HOS) schedules and daily driver log sheets**.

The application takes the driver's current location, pickup location, and drop-off location, calculates the actual driving route, estimates travel time, plans required breaks/rest/fuel stops, and converts the complete trip into daily ELD log sheets.

---

## 📌 Project Overview

Long-haul truck drivers need to follow strict Hours of Service (HOS) regulations while planning their trips.

The ELD Trip Planner simplifies this process by combining:

* 🗺️ Real-world route planning
* 📍 Location geocoding
* 🚚 Truck trip planning
* ⏱️ Driving and duty-time calculation
* 🛌 Required rest periods
* ☕ 30-minute breaks
* ⛽ Fuel-stop planning
* 📋 Daily ELD log generation
* 🗺️ Interactive route visualization
* 🔐 Driver authentication and profiles
* 💾 Trip history storage

Instead of manually calculating driving hours and rest periods, the application automatically generates a day-by-day duty-status timeline.

---

# ✨ Features

## 🚚 Trip Planning

Users can enter:

* Current location
* Pickup location
* Drop-off location

The backend geocodes these locations and determines the coordinates required for route calculation.

---

## 🗺️ Real Route Calculation

The application uses **OpenRouteService** to calculate:

* Driving route
* Total distance
* Estimated driving duration
* Turn-by-turn instructions
* Route geometry

The route is then displayed on an interactive map.

---

## ⏱️ HOS Scheduling Engine

The core of the application is the `hos_engine.py` module.

It simulates the driver's working day according to configured HOS rules, including:

* 11-hour driving limit
* 14-hour duty window
* 30-minute break requirement
* 70-hour / 8-day limit
* 10-hour reset
* Fuel stops
* Rest periods

The engine converts the trip into a timeline containing different driver duty statuses.

Example:

```text
00:00 ───────────────────────────── 24:00

OFF DUTY
████████

DRIVING
        █████████████

ON DUTY
                     ███

OFF DUTY
                         █████████
```

Long trips are automatically divided across multiple days.

---

## 📋 ELD Daily Log Sheets

The generated HOS timeline is displayed using the `LogSheet` component.

The log contains the standard duty-status categories:

* Off Duty
* Sleeper Berth
* Driving
* On Duty

Each day receives its own log sheet.

For example:

```text
Day 1
├── Off Duty
├── Driving
├── 30-Min Break
├── Driving
├── Fuel Stop
└── Sleeper Berth

Day 2
├── Off Duty
├── Driving
├── Break
├── Driving
└── Sleeper Berth
```

The frontend renders these schedules as an SVG-based grid resembling a traditional driver's daily log.

---

# 🗺️ Interactive Route Map

The `RouteMap` component displays the planned trip using OpenStreetMap.

The map can show:

* 📍 Current location
* 📦 Pickup location
* 🏁 Drop-off location
* 🛌 Planned rest stops
* ☕ Break locations
* ⛽ Fuel stops
* 🛣️ Planned route

The route geometry returned by OpenRouteService is rendered directly on the map.

---

# 🧭 Route Instructions

OpenRouteService also provides turn-by-turn instructions.

These instructions are displayed in the application's **Route Instructions** section.

Example:

```text
1. Head east on Main Street
2. Turn right onto Highway 35
3. Continue onto Interstate 40
4. Take exit 123
5. Continue toward Dallas
```

---

# 🔐 Driver Profiles & Trip History

The backend uses Django's database system to store application data.

The project currently uses:

```text
SQLite
```

The database file is:

```text
backend/db.sqlite3
```

Depending on the application's authentication implementation, driver-related information and trip history can be persisted in the backend database.

---

# 🏗️ System Architecture

The project follows a simple full-stack architecture:

```text
                    ┌─────────────────────┐
                    │      User           │
                    │  React Frontend     │
                    └──────────┬──────────┘
                               │
                               │ HTTP Request
                               ▼
                    ┌─────────────────────┐
                    │    Django Backend   │
                    │      views.py       │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       Geocoding API     OpenRouteService    HOS Engine
              │                │                │
              └────────────────┼────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Trip Calculation  │
                    │   + HOS Timeline    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     JSON Response   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │                     │
                    │  Map + Log Sheets   │
                    │  Instructions       │
                    └─────────────────────┘
```

---

# 🔄 How the Project Works

The complete workflow looks like this:

```text
User enters trip details
          ↓
React sends API request
          ↓
Django receives request
          ↓
Locations are geocoded
          ↓
Coordinates are obtained
          ↓
OpenRouteService calculates route
          ↓
Distance + duration + geometry
          ↓
HOS Engine processes driving time
          ↓
Break/rest/fuel stops are planned
          ↓
Daily duty-status timeline generated
          ↓
Backend returns trip data
          ↓
React displays:
    ├── Route Map
    ├── Route Instructions
    ├── Trip Information
    └── Daily Log Sheets
```

---

# 🧠 HOS Engine

The HOS engine is the most important part of the project.

Located at:

```text
backend/
└── hos_engine.py
```

Its job is to simulate the driver's working schedule.

The engine considers:

### 11-Hour Driving Limit

A driver cannot continuously drive beyond the configured daily driving limit.

The engine tracks accumulated driving time and schedules rest when the limit is reached.

---

### 14-Hour Duty Window

The driver has a limited working window.

The engine tracks the total elapsed duty window and prevents the schedule from exceeding the configured limit.

---

### 30-Minute Break

A required break is inserted into the schedule when the driver's accumulated working/driving time requires it.

---

### 70-Hour / 8-Day Limit

The engine can track the driver's cumulative on-duty hours across the applicable rolling period.

This prevents the schedule from simply treating every day as an independent unlimited workday.

---

### 10-Hour Reset

A longer rest period can reset the driver's daily availability.

The engine uses this when planning multi-day trips.

---

### Fuel Stops

For long trips, fuel stops are planned at configured distance intervals.

For example:

```text
Start
  ↓
Driving
  ↓
Fuel Stop
  ↓
Driving
  ↓
Break
  ↓
Driving
  ↓
Rest
```

---

# 🛠️ Technology Stack

## Frontend

* React
* Vite
* JavaScript
* HTML
* CSS
* Leaflet / map rendering
* OpenStreetMap

## Backend

* Python
* Django
* Django REST API
* SQLite
* Python virtual environment

## External Services

* OpenRouteService
* OpenStreetMap

## Development Tools

* Git
* GitHub
* npm
* pip
* Postman
* VS Code

---

# 📁 Project Structure

The repository is organized approximately like this:

```text
ELD-Trip-Planner/
│
├── backend/
│   │
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── db.sqlite3
│   │
│   ├── hos_engine.py
│   │
│   ├── core/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── ...
│   │
│   └── ...
│
├── frontend/
│   │
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   │
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── LogSheet.jsx
│       │   ├── RouteMap.jsx
│       │   └── ...
│       └── ...
│
├── .gitignore
└── README.md
```

> The exact files may differ slightly depending on the current version of the project.

---

# 🚀 Running the Project Locally

## Prerequisites

Before starting, install:

### Python

Python **3.10 or newer**

Check:

```bash
python --version
```

---

### Node.js

Node.js **18 or newer**

Check:

```bash
node --version
```

and:

```bash
npm --version
```

---

### Git

Check:

```bash
git --version
```

---

# 🔑 OpenRouteService API Key

The application requires an OpenRouteService API key for routing and geocoding.

Create a free account at:

https://openrouteservice.org/dev/#/signup

After signing in:

1. Open the developer dashboard.
2. Create an API key.
3. Copy the key.
4. Add it to your local backend environment.

---

# 📥 Clone the Repository

If you want to run the project from your GitHub repository, first clone it.

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

For example:

```bash
git clone https://github.com/your-username/eld-trip-planner.git
```

Move into the project:

```bash
cd eld-trip-planner
```

You should now have:

```text
eld-trip-planner/
├── backend/
├── frontend/
└── README.md
```

---

# 🐍 Backend Setup

Open a terminal in the project directory.

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

---

## Activate Virtual Environment

### Windows PowerShell

```powershell
venv\Scripts\Activate.ps1
```

### Windows CMD

```cmd
venv\Scripts\activate
```

### macOS / Linux

```bash
source venv/bin/activate
```

After activation, you should see something similar to:

```text
(venv)
```

in your terminal.

---

# 📦 Install Backend Dependencies

Run:

```bash
pip install -r requirements.txt
```

If `requirements.txt` does not contain a required package, install the package and update the requirements file:

```bash
pip freeze > requirements.txt
```

---

# 🔐 Configure the API Key

Create:

```text
backend/.env
```

You can use `.env.example` as a template.

Example:

```env
ORS_API_KEY=your_openrouteservice_api_key_here
```

If the project reads the environment variable directly, you can also set it from the terminal.

### Windows PowerShell

```powershell
$env:ORS_API_KEY="your_actual_key_here"
```

### Windows CMD

```cmd
set ORS_API_KEY=your_actual_key_here
```

### macOS / Linux

```bash
export ORS_API_KEY=your_actual_key_here
```

> Never commit your real API key to GitHub.

---

# 🗄️ Run Database Migrations

From the `backend` directory:

```bash
python manage.py migrate
```

This creates/updates the Django database tables.

---

# ▶️ Start Django Backend

Run:

```bash
python manage.py runserver
```

The backend should start at:

```text
http://localhost:8000
```

You can test the backend by opening:

```text
http://localhost:8000
```

The trip-planning API is available at:

```text
http://localhost:8000/api/plan-trip/
```

---

# ⚛️ Frontend Setup

Open a **new terminal**.

Move to the frontend:

```bash
cd eld-trip-planner/frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will normally start the frontend at:

```text
http://localhost:5173
```

Open that address in your browser.

---

# 🔗 Running Both Servers

You need both servers running at the same time.

### Terminal 1

```bash
cd backend
venv\Scripts\activate
python manage.py runserver
```

### Terminal 2

```bash
cd frontend
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

# 🧪 Example Trip

A user can enter something like:

```text
Current Location:
Oklahoma City, OK

Pickup:
Dallas, TX

Drop-off:
Houston, TX
```

The frontend sends the data to Django.

The backend then:

```text
Oklahoma City
      ↓
Geocoding
      ↓
Coordinates

Dallas
      ↓
Geocoding
      ↓
Coordinates

Houston
      ↓
Geocoding
      ↓
Coordinates
```

OpenRouteService calculates the route.

Then the HOS engine processes the resulting driving time.

Finally, the frontend displays:

```text
Trip Summary
     +
Route Map
     +
Route Instructions
     +
Fuel Stops
     +
Breaks
     +
Rest Periods
     +
Daily ELD Logs
```

---

# 🔌 API

## Plan Trip

### Endpoint

```http
POST /api/plan-trip/
```

### Purpose

Calculates a complete trip and generates the corresponding HOS schedule.

### Example Request

```json
{
  "current_location": "Oklahoma City, OK",
  "pickup_location": "Dallas, TX",
  "dropoff_location": "Houston, TX"
}
```

The exact request fields should match the implementation in the backend.

---

# 📤 API Response

The backend returns information used by the frontend, such as:

```text
Trip information
Distance
Duration
Route geometry
Route instructions
Stops
HOS timeline
Daily logs
```

The React application consumes this response and converts it into visual components.

---

# 🗺️ Map Data Flow

The map workflow is:

```text
Location Name
     ↓
Geocoding
     ↓
Latitude + Longitude
     ↓
OpenRouteService
     ↓
Route Geometry
     ↓
React RouteMap
     ↓
Leaflet / OpenStreetMap
```

The application does not manually draw the road route.

The route geometry comes from the routing service and is rendered by the frontend.

---

# 🌐 Environment Variables

## Backend

Example:

```env
ORS_API_KEY=your_openrouteservice_api_key_here
```

## Frontend

If the frontend is configured to use a backend URL through Vite:

```env
VITE_API_URL=http://localhost:8000
```

For production:

```env
VITE_API_URL=https://your-backend.onrender.com
```

Do not commit secrets or private credentials.

---

# 🚫 Files That Should Not Be Committed

Make sure `.gitignore` contains:

```gitignore
# Python
venv/
__pycache__/
*.pyc

# Environment variables
.env

# Django
db.sqlite3

# Node
node_modules/

# Build
dist/

# IDE
.vscode/
.idea/
```

If you want to keep the SQLite database in the repository for a specific assessment requirement, remove `db.sqlite3` from `.gitignore`.

---

# ☁️ Deployment

The project can be deployed using:

```text
Frontend → Vercel
Backend  → Render
```

---

# 🚀 Backend Deployment on Render

## 1. Push the project to GitHub

```bash
git add .
git commit -m "Prepare project for deployment"
git push origin main
```

Make sure `.env` is **not** committed.

---

## 2. Create Render Web Service

On Render:

1. Create a new Web Service.
2. Connect your GitHub repository.
3. Set the backend directory as the root directory.

Example:

```text
Root Directory:
backend
```

---

## 3. Build Command

```bash
pip install -r requirements.txt
```

---

## 4. Start Command

For Gunicorn:

```bash
gunicorn core.wsgi
```

Make sure Gunicorn exists in `requirements.txt`.

For example:

```bash
pip install gunicorn
pip freeze > requirements.txt
```

---

## 5. Environment Variables

Add:

```text
ORS_API_KEY = your_openrouteservice_api_key
```

Also configure any other production environment variables required by the Django settings.

---

## 6. Allowed Hosts

Update Django's `ALLOWED_HOSTS` with the Render domain.

Example:

```python
ALLOWED_HOSTS = [
    "your-app.onrender.com",
]
```

---

# ⚡ Frontend Deployment on Vercel

## 1. Create Vercel Project

Connect the GitHub repository.

Set the frontend directory as the root directory:

```text
frontend
```

---

## 2. Environment Variable

Set:

```text
VITE_API_URL=https://your-app.onrender.com
```

---

## 3. Deploy

Vercel should automatically detect the Vite project.

The frontend will receive a public URL similar to:

```text
https://your-project.vercel.app
```

---

# 🔐 CORS Configuration

After deploying the frontend, add the Vercel URL to Django's allowed origins.

Example:

```python
CORS_ALLOWED_ORIGINS = [
    "https://your-project.vercel.app",
]
```

For local development:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]
```

---

# 🧩 Important Project Components

## `App.jsx`

The main frontend application.

Responsibilities include:

* Collecting trip information
* Sending API requests
* Receiving trip results
* Displaying the main application interface

---

## `RouteMap.jsx`

Responsible for visualizing the route.

It displays:

* Route
* Current location
* Pickup
* Drop-off
* Planned stops

---

## `LogSheet.jsx`

Responsible for displaying daily driver logs.

It converts the backend HOS timeline into a visual ELD-style grid.

---

## `views.py`

The main backend request-handling logic.

It coordinates:

```text
Request
  ↓
Location processing
  ↓
Routing API
  ↓
HOS engine
  ↓
Response
```

---

## `hos_engine.py`

The core trip scheduling logic.

It handles the driver's:

```text
Driving
Breaks
Rest
Fuel stops
Duty windows
Daily limits
Multi-day scheduling
```

This is the main business-logic component of the project.

---

# 🧪 Testing

You can test the API using Postman.

Example:

```http
POST http://localhost:8000/api/plan-trip/
```

Set:

```text
Content-Type: application/json
```

Then send the appropriate JSON request body.

The same API is automatically consumed by the React frontend.

---

# 🐛 Troubleshooting

## `Could not find location`

Try using a more specific location.

Instead of:

```text
Dallas
```

try:

```text
Dallas, TX
```

or:

```text
Dallas, Texas, USA
```

---

## OpenRouteService Routing Error

If OpenRouteService returns a routing error, verify:

1. The API key is valid.
2. The coordinates are valid.
3. The location is near a routable road.
4. The API request has not exceeded the service limits.

---

## CORS Error

Check:

```python
CORS_ALLOWED_ORIGINS
```

Make sure your frontend URL is included.

Local:

```text
http://localhost:5173
```

Production:

```text
https://your-project.vercel.app
```

---

## Map Not Showing

Check:

* Browser console
* Leaflet installation
* Leaflet CSS
* OpenStreetMap tile requests
* Route API response

Make sure the required Leaflet CSS is loaded.

---

## Backend Not Starting

First activate the virtual environment:

### Windows

```powershell
venv\Scripts\Activate.ps1
```

Then install dependencies:

```bash
pip install -r requirements.txt
```

Run:

```bash
python manage.py check
```

If there are no configuration errors:

```bash
python manage.py runserver
```

---

## Migration Error

Run:

```bash
python manage.py makemigrations
python manage.py migrate
```

Then start the server again:

```bash
python manage.py runserver
```

---

# 🔄 How to Get the Latest Code

If the repository already exists on your machine:

```bash
git pull origin main
```

Then update dependencies if required:

```bash
pip install -r backend/requirements.txt
```

and:

```bash
cd frontend
npm install
```

---

# 👥 How Another Developer Can Run This Project

A new developer only needs to:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd eld-trip-planner
```

Then:

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Configure:

```env
ORS_API_KEY=YOUR_API_KEY
```

Run:

```bash
python manage.py migrate
python manage.py runserver
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Then open:

```text
http://localhost:5173
```

That's it. 🚛

---

# 🎥 Loom Demonstration

For the project demonstration, the recommended flow is:

### 1. Show the application

Open the frontend.

### 2. Enter trip details

Enter:

```text
Current Location
Pickup Location
Drop-off Location
```

### 3. Plan the trip

Click:

```text
Plan Trip
```

### 4. Show the route

Demonstrate:

* Route
* Pickup
* Drop-off
* Stops
* Distance
* Duration

### 5. Show route instructions

Scroll through the turn-by-turn instructions.

### 6. Show ELD logs

Demonstrate how the trip is divided into daily log sheets.

### 7. Explain the HOS engine

Open:

```text
hos_engine.py
```

Explain how the engine calculates:

```text
Driving
↓
Break
↓
Driving
↓
Fuel
↓
Rest
↓
Next Day
```

The HOS engine is the main business-logic portion of the application.

---

# 🎯 Project Goals

The main goals of ELD Trip Planner are:

* Reduce manual trip-planning work
* Visualize long-distance routes
* Automatically account for driver working hours
* Generate daily driver logs
* Make HOS planning easier to understand
* Provide an interactive planning experience
* Demonstrate a complete full-stack application

---

# 🔮 Future Improvements

Possible future improvements include:

* Real-time traffic information
* Weather-aware trip planning
* Truck-specific routing
* Multiple driver support
* Team-driver scheduling
* Advanced fuel optimization
* Truck parking availability
* PDF export of ELD logs
* Printable driver logs
* Trip sharing
* Cloud database
* Production authentication
* Notifications for upcoming breaks
* More detailed HOS rule configurations
* Admin dashboard
* Historical trip analytics

---

# ⚠️ Disclaimer

This project is intended for **educational, demonstration, and trip-planning purposes**.

The generated HOS schedule should not be treated as a substitute for official regulatory guidance, carrier policies, or a certified ELD system.

Actual compliance requirements can depend on the driver's circumstances, applicable regulations, exemptions, and operational conditions.

Always verify regulatory requirements before using a generated schedule for real-world compliance.

---

# 📄 License

Add your preferred license here.

For example:

```text
MIT License
```

---

# 👨‍💻 Development

The project demonstrates a complete full-stack workflow:

```text
React
  ↓
REST API
  ↓
Django
  ↓
Geocoding + Routing
  ↓
HOS Business Logic
  ↓
JSON
  ↓
React
  ↓
Map + ELD Logs
```

The project combines **frontend development, backend API development, external API integration, geospatial routing, business-logic implementation, and data visualization** into one application.

---

## ⭐ Quick Start

For experienced developers, the shortest setup is:

```bash
# Clone
git clone YOUR_GITHUB_REPOSITORY_URL
cd eld-trip-planner

# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Configure ORS_API_KEY
python manage.py migrate
python manage.py runserver
```

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Then visit:

```text
http://localhost:5173
```

🚛 **Enter your locations → Plan the trip → View the route → Review HOS → Check the daily ELD logs.**
