# Healthcare Management System

## Stack
- **Backend**: Node.js + Express.js + MySQL
- **Frontend**: React (Vite) + Recharts
- **AI**: Google Gemini 1.5 Flash
- **Notifications**: Twilio WhatsApp

## Setup

### 1. Database
Run `backend/config/schema.sql` in MySQL Workbench or CLI:
```sql
source schema.sql
```

### 2. Backend
```bash
cd backend
# Edit .env with your credentials
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm run dev
```

### 4. Or use the startup script
```
start.bat
```

## Environment Variables (`backend/.env`)
| Variable | Description |
|---|---|
| `DB_HOST` | MySQL host (localhost) |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | `health` |
| `JWT_SECRET` | Any random secret string |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_WHATSAPP_FROM` | `whatsapp:+14155238886` (sandbox) |

## Features
- JWT Authentication (Patient / Doctor / Family roles)
- Patient & Doctor profiles
- Health monitoring with AI health score (0–100)
- Auto alerts for high heart rate (>100 bpm) & low sleep (<5 hrs)
- AI symptom checker + health chatbot (Gemini with offline fallback)
- Medicine/health reminders with WhatsApp notifications via Twilio
- Family group management
- Doctor panel: view patients, health records, write prescriptions
- Appointment booking & telemedicine status management
.\start.bat
## URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
