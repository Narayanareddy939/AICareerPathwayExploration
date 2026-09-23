# Deployment & Operations Guide

## 1. Local Development Setup

### Prerequisites
- Node.js (v18+)
- Python 3.10+ (Optional for local AI training)
- MongoDB Atlas account (Optional — the server runs seamlessly in dataset-fallback mode if MongoDB is unconfigured)

### Step 1: Install Dependencies
```bash
# Frontend
cd client
npm install

# Backend
cd ../server
npm install

# Python AI (Optional)
cd ../python-ai
pip install -r requirements.txt
```

### Step 2: Start Development Servers
```bash
# Terminal 1: Backend Server (Port 5000)
cd server
npm start

# Terminal 2: Frontend App (Port 5173)
cd client
npm run dev

# Terminal 3: Python AI (Port 5001 - Optional)
cd python-ai
python main.py
```

---

## 2. Production Deployment

### Frontend (Vercel / Netlify)
1. Set Build Command: `npm run build`
2. Set Output Directory: `dist`
3. Configure Environment Variable: `VITE_API_URL=https://your-backend-domain.com/api`

### Backend (Render / Railway / AWS EC2)
1. Set Start Command: `node index.js`
2. Set Environment Variables:
   - `PORT=5000`
   - `JWT_SECRET=your_jwt_secret_key`
   - `MONGODB_URI=your_mongodb_atlas_connection_string`
   - `GEMINI_API_KEY=your_gemini_api_key`
