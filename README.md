# ELD Trip Planner — Run Karne Ka Tarika

Ye poora project ready hai — backend (Django) aur frontend (React) dono. Neeche steps follow kar ke apne laptop pe chala sakte ho.

## Zaroori cheezein pehle install karo

- Python 3.10+
- Node.js 18+ (npm ke saath)
- Ek free OpenRouteService API key — https://openrouteservice.org/dev/#/signup pe jaake free sign up karo, dashboard se API key copy kar lo.

---

## Step 1: Backend chalao

```bash
cd backend
python -m venv venv

# venv activate karo:
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

pip install -r requirements.txt
```

Ab apni API key set karo. `backend/.env.example` file ko copy karke `.env` bana lo aur usme apni key daal do — LEKIN Django `.env` file khud read nahi karta, isliye simplest tarika: terminal mein directly set karo before running server:

```bash
export ORS_API_KEY=your_actual_key_here      # Mac/Linux
set ORS_API_KEY=your_actual_key_here         # Windows (cmd)
$env:ORS_API_KEY="your_actual_key_here"      # Windows (PowerShell)
```

Phir migrations aur server:

```bash
python manage.py migrate
python manage.py runserver
```

Backend ab `http://localhost:8000` pe chal raha hoga. Test karne ke liye:
`http://localhost:8000/api/plan-trip/` pe POST request bhejo (Postman se ya frontend se).

---

## Step 2: Frontend chalao

Naye terminal tab mein:

```bash
cd frontend
npm install
npm run dev
```

Frontend `http://localhost:5173` pe khul jayega. Form bharo, "Plan Trip" click karo — map aur log sheets dikhenge.

---

## Kaise kaam karta hai (samajhne ke liye)

1. **Frontend** (`App.jsx`) form data ko Django API ko POST karta hai.
2. **Backend** (`views.py`) pehle teeno locations ko geocode karta hai (naam se coordinates), phir OpenRouteService se actual route/distance/duration nikalta hai.
3. **HOS Engine** (`hos_engine.py`) — ye sabse important file hai. Ye FMCSA ke rules (11hr driving limit, 14hr window, 30-min break, 70hr/8-day limit, 10hr reset, fuel stop har 1000 miles) ko simulate karke din-wise duty-status timeline banata hai.
4. **LogSheet component** us timeline ko SVG grid mein draw karta hai — bilkul asli "Driver's Daily Log" form jaisa (Off Duty / Sleeper Berth / Driving / On Duty rows). Long trips automatically multiple daily log sheets mein split hote hain.
5. **RouteMap component** OpenStreetMap tiles (free) par the OpenRouteService route draw karta hai, current/pickup/dropoff markers aur planned rest/fuel/break markers dikhata hai.
6. OpenRouteService se turn-by-turn route instructions bhi return hoti hain aur dashboard ke **Route Instructions** panel mein dikhayi jaati hain.

### Driver details ka database

Driver profile, login details, and trip history Django ke default SQLite
database (`backend/db.sqlite3`) mein save hote hain. Backend `.env` mein
OpenRouteService key add karo:

```env
ORS_API_KEY=your_openrouteservice_api_key_here
```

---

## Deploy karne ka tarika (assessment ke liye zaroori)

### Backend (Render.com — free tier)
1. GitHub pe poora code push karo.
2. Render.com pe naya "Web Service" banao, apna GitHub repo connect karo, root directory `backend` set karo.
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn core.wsgi` (pehle `pip install gunicorn` karke requirements.txt mein add karo)
5. Environment variable add karo: `ORS_API_KEY` = apni key
6. `ALLOWED_HOSTS` mein `settings.py` mein apna Render domain add karna hoga (e.g. `your-app.onrender.com`)

### Frontend (Vercel)
1. Vercel pe naya project banao, GitHub repo connect karo, root directory `frontend` set karo.
2. Environment variable add karo: `VITE_API_URL` = apna Render backend URL (e.g. `https://your-app.onrender.com`)
3. Deploy karo — Vercel khud detect kar lega ki Vite project hai.
4. Backend ke `CORS_ALLOWED_ORIGINS` mein (settings.py) apna Vercel URL add karna mat bhoolna.

---

## Baaki deliverables

- **GitHub**: poora code (backend + frontend) ek repo mein push karo, `.env` aur `venv/` ko `.gitignore` mein rakhna.
- **Loom video (3-5 min)**: app use karke dikhao (form → map → log sheets), phir code mein `hos_engine.py` explain karo (ye part sabse zyada matter karta hai kyunki yahi core logic hai).

---

## Agar koi cheez kaam na kare

- **"Could not find location" error** → location name thoda specific likho (e.g. "Dallas, TX" instead of sirf "Dallas")
- **CORS error frontend pe** → check karo backend ke `CORS_ALLOWED_ORIGINS` mein frontend ka URL hai
- **Map nahi dikh raha** → browser console check karo, Leaflet CSS load hui ya nahi (index.html mein hai already)
