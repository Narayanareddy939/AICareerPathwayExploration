# API Documentation & Endpoints

## Base URL
- Local: `http://localhost:5000/api`
- Python AI Engine: `http://localhost:5001`

---

## 1. Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Log in and receive JWT token | No |
| `GET` | `/api/auth/me` | Fetch active user session | Bearer Token |

---

## 2. Student & Profile Endpoints (`/api/student`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/student/profile` | Retrieve student profile details | Bearer Token |
| `POST` | `/api/student/profile` | Create or update full student profile | Bearer Token |

---

## 3. Career & Recommendation Endpoints (`/api/careers`, `/api/recommend`)
| Method | Endpoint | Description | Sample Payload / Response |
|---|---|---|---|
| `GET` | `/api/careers` | List all careers with filtering | Query: `?category=AI&search=ML` |
| `GET` | `/api/careers/:id` | Get career pathway details | Returns career profile |
| `POST` | `/api/recommend` | Generate top 5 career recommendations | `{ "branch": "CSE", "cgpa": 8.5, "skills": ["Python", "React"] }` |

---

## 4. Alumni & Mentorship (`/api/alumni`, `/api/alumni-v2`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/alumni` | Search & filter 1000 alumni records |
| `GET` | `/api/alumni/:id` | Retrieve single alumni profile |
| `POST` | `/api/alumni/mentorship` | Send mentorship inquiry to alumnus |

---

## 5. Learning Roadmaps (`/api/roadmaps`, `/api/roadmap`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/roadmap` | Generate step-by-step preparation roadmap |
| `POST` | `/api/roadmaps/milestone` | Mark milestone completed/pending |

---

## 6. Resume Analyzer (`/api/resume`, `/api/analyze-resume`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/resume/upload` | Upload PDF/DOCX resume file |
| `POST` | `/api/analyze-resume` | Extract ATS score, skills, and gaps from text |

---

## 7. AI Career Advisor Chat (`/api/chat`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Chat with Gemini / AI Career Advisor |

---

## 8. Analytics & Admin (`/api/analytics`, `/api/admin/stats`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics` | Public platform analytics & chart data |
| `GET` | `/api/admin/stats` | System stats, ML model state, weights |
