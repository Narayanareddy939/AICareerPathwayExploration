# 🚀 AI Career Pathway Exploration Platform

An intelligent, multi-tier career recommendation and navigation system designed to empower students with personalized career roadmaps, skill gap diagnostics, live industry insights, resume optimization, and alumni mentorship.

---

## 🌟 Key Features

1. **AI Hybrid Career Recommendation**
   - Weighted multi-criteria scoring model incorporating skill match, domain affinity, academic CGPA, market demand, and alumni trajectory similarity.
2. **Interactive Skill Gap Analyzer**
   - Categorized priority gaps (Critical, High, Medium, Low) with tailored course recommendations from Coursera & top providers.
3. **Dynamic Roadmap Generator**
   - Multi-phase career preparation roadmap with actionable milestone checkoffs and skill tracking.
4. **Alumni Knowledge Network**
   - 1,000+ verified alumni records with career histories, companies, salary benchmarks, and direct mentorship inquiry.
5. **Natural Language Resume ATS Analyzer**
   - Deep entity and keyword extraction, ATS compatibility score, strengths, and actionable feedback.
6. **Career Scenario Explorer**
   - Side-by-side comparison of up to 4 career paths with readiness timelines, package projections, and risk indices.
7. **Higher Studies Pathways**
   - Structured guidance for GATE (IITs/IISc), GRE (MS abroad), and CAT (IIMs/MBA).
8. **AI Career Advisor Chatbot**
   - Powered by Google Gemini 1.5 Flash with intelligent contextual fallbacks.
9. **Platform Analytics & Admin Dashboard**
   - Recharts-powered distribution of career demand, salary bands, alumni placements, and system health metrics.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 19, Vite 6, React Router DOM v7, Recharts, Lucide React, Custom Dark-Mode Glassmorphism Design System.
- **Backend**: Node.js v24+, Express.js, JWT Authentication, Multer, Mongoose.
- **AI & ML Engine**: Python Flask, Scikit-Learn, SentenceTransformers, TF-IDF, Gemini 1.5 Flash.
- **Datasets**: 6 Processed Datasets (1,000 Alumni records, 100 Careers, 100 Jobs, 100 Courses, 67 Skills Taxonomy).

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

### 2. Run the Application
```bash
# Terminal 1: Backend Server (runs on http://localhost:5000)
cd server
npm start

# Terminal 2: Frontend App (runs on http://localhost:5173)
cd client
npm run dev
```

---

## 📚 Documentation
- [System Architecture](file:///c:/Users/hi/OneDrive/MINI%20project/Ai_Carrier/docs/architecture.md)
- [Database Schema](file:///c:/Users/hi/OneDrive/MINI%20project/Ai_Carrier/docs/database-schema.md)
- [API Documentation](file:///c:/Users/hi/OneDrive/MINI%20project/Ai_Carrier/docs/api-documentation.md)
- [ML Algorithms Specification](file:///c:/Users/hi/OneDrive/MINI%20project/Ai_Carrier/docs/ml-algorithms.md)
- [Datasets & Provenance](file:///c:/Users/hi/OneDrive/MINI%20project/Ai_Carrier/docs/datasets.md)
- [Dataset Analysis](file:///c:/Users/hi/OneDrive/MINI%20project/Ai_Carrier/docs/dataset-analysis.md)
- [Deployment Guide](file:///c:/Users/hi/OneDrive/MINI%20project/Ai_Carrier/docs/deployment.md)

---

## 📄 License
This project is developed for academic and career advancement purposes.
