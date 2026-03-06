# 🏥 MediRoute – Smart Patient Triage & Appointment System

> **Hackathon Project** – AI-powered symptom analysis and appointment booking system

---

## 🎯 Overview

MediRoute helps patients find the right doctor by analyzing symptoms, determining severity (triage), recommending the correct medical department, and booking appointments with real-time slot availability.

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Django 4.2 + Django REST Framework |
| Database | SQLite |
| Communication | REST API (JSON) |

---

## ⚡ Quick Start

### 1. Clone / Extract the project

```
healthcare-app/
├── backend/        ← Django project
└── frontend/       ← React (Vite) project
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed the database with doctors and slots
python seed_data.py

# Create superuser for admin panel (optional)
python manage.py createsuperuser

# Start the server
python manage.py runserver
```

Backend runs at: **http://localhost:8000**  
Admin panel: **http://localhost:8000/admin/**

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze-symptoms/` | Analyze symptoms, get doctor + slots |
| POST | `/api/book-appointment/` | Book selected slot |
| GET | `/api/symptom-suggestions/?q=` | Autocomplete suggestions |
| GET | `/api/doctors/` | List all doctors |
| GET | `/api/appointments/` | List all appointments |

### POST `/api/analyze-symptoms/`
```json
// Request
{
  "name": "Rahul Sharma",
  "age": 34,
  "symptoms": "chest pain, shortness of breath"
}

// Response
{
  "department": "Cardiology",
  "doctor": { "id": 1, "name": "Rajesh Sharma", ... },
  "severity": "High",
  "reason": "Symptoms matched with heart-related conditions...",
  "emergency_warning": "⚠️ High Risk Symptoms Detected...",
  "available_slots": [
    { "id": 1, "date": "2024-06-10", "time_slot": "10:00 AM", "estimated_wait_time": 15 }
  ]
}
```

### POST `/api/book-appointment/`
```json
// Request
{
  "patient_name": "Rahul Sharma",
  "patient_age": 34,
  "doctor_id": 1,
  "slot_id": 5,
  "symptoms": "chest pain",
  "severity": "High"
}

// Response
{
  "message": "Appointment booked successfully",
  "token_number": "A001",
  "appointment": { ... }
}
```

---

## 🏗️ Features

- **Symptom Analysis** – Keyword-based mapping to 8 medical departments
- **Severity Detection** – Triage classification: Low / Medium / High
- **Emergency Alerts** – Visual warnings for high-risk symptom combinations
- **Doctor Assignment** – Auto-selects best available doctor
- **Live Slots** – Real-time availability with estimated wait times
- **Token Generation** – Auto-incrementing appointment tokens (A001, A002...)
- **Symptom Autocomplete** – Suggestions while typing
- **Quick Add Chips** – One-click common symptom selection
- **Django Admin** – Full admin panel for hospital staff

---

## 🏥 Departments Supported

| Department | Example Symptoms |
|------------|-----------------|
| Cardiology | Chest pain, heart palpitations, breathlessness |
| Dermatology | Skin rash, itching, eczema |
| Orthopedics | Bone pain, fracture, joint pain |
| General Medicine | Fever, cough, headache |
| Neurology | Migraine, seizure, numbness |
| Gastroenterology | Bloating, acid reflux, liver issues |
| ENT | Ear pain, sinus, tonsils |
| Ophthalmology | Eye pain, blurred vision |

---

## 📁 Project Structure

```
backend/
├── config/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── api/
│   ├── models.py           # Doctor, DoctorAvailability, Patient, Appointment
│   ├── views.py            # REST API views
│   ├── serializers.py      # DRF serializers
│   ├── urls.py             # URL routing
│   ├── admin.py            # Admin configuration
│   └── symptom_analyzer.py # Triage engine
├── seed_data.py            # Database seeder
├── manage.py
└── requirements.txt

frontend/
├── src/
│   ├── pages/
│   │   ├── SymptomForm.jsx          # Step 1: Enter symptoms
│   │   ├── RecommendationResult.jsx # Step 2: View & select slot
│   │   └── AppointmentConfirmation.jsx # Step 3: Confirmation + token
│   ├── components/
│   │   └── Header.jsx               # Navigation with step progress
│   ├── services/
│   │   └── api.js                   # Fetch API calls
│   ├── App.jsx
│   └── index.css
├── index.html
├── vite.config.js
└── package.json
```

---

## 🎨 UI Design

- **Font**: DM Serif Display (headings) + DM Sans (body)
- **Palette**: Clean off-white background, forest green accent (#1A6B5A)
- **Severity Colors**: Red (High), Amber (Medium), Green (Low)
- **Responsive**: Works on desktop and mobile

---

## 🧪 Demo Flow

1. Patient enters name, age, and symptoms
2. Quick-add chips or autocomplete for symptom input
3. Backend analyzes → returns department, doctor, severity
4. High-risk symptoms show emergency warning banner
5. Available slots displayed as selectable cards
6. Patient selects slot → clicks "Confirm Appointment"
7. Token number generated (e.g. A023)
8. Confirmation page with full details and visit instructions
