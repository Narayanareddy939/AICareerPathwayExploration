# Database Schema & Data Models

## MongoDB Collections & Schema Definitions

### 1. `User`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Primary Key |
| `name` | String | Full user name |
| `email` | String (unique) | Email address |
| `password` | String | Bcrypt-hashed password |
| `role` | String (enum) | `student`, `admin`, `alumni`, `counselor` |
| `profileCompleted` | Boolean | Profile completion flag |
| `createdAt` | Date | Timestamp |

---

### 2. `Student` (Extended Profile)
| Field | Type | Description |
|---|---|---|
| `userId` | ObjectId (ref: User) | Reference to User |
| `branch` | String | Engineering branch / Department |
| `cgpa` | Number | Current academic CGPA (0.0 - 10.0) |
| `skills` | [String] | Technical & core competencies |
| `interests` | [String] | Target domains and fields |
| `targetRole` | String | Preferred career track |
| `resumeUrl` | String | Cloud/local file path |
| `placementStatus` | String | `Ready`, `In Preparation`, `Placed` |

---

### 3. `Alumni`
| Field | Type | Description |
|---|---|---|
| `name` | String | Alumni name |
| `graduationYear` | Number | Batch year |
| `branch` | String | Department |
| `currentCompany` | String | Current employer |
| `role` | String | Current job title |
| `cgpa` | Number | Academic CGPA |
| `skills` | [String] | Skills & tech stack |
| `mentorshipAvailable` | Boolean | Flag for student mentorship |
| `careerTrajectory` | [Object] | History of past companies & promotions |

---

### 4. `Career`
| Field | Type | Description |
|---|---|---|
| `title` | String (unique) | Career role title |
| `category` | String | Industry category |
| `description` | String | Role overview and duties |
| `requiredSkills` | [String] | List of mandatory competencies |
| `averageSalary` | String | Market compensation band |
| `growthRate` | String | Projected CAGR |
| `demandIndex` | Number | 0-100 demand score |

---

### 5. `Roadmap`
| Field | Type | Description |
|---|---|---|
| `userId` | ObjectId (ref: User) | Associated student |
| `targetRole` | String | Role being targeted |
| `estimatedDurationMonths` | Number | Total preparation duration |
| `phases` | [Object] | Phase breakdown with milestones, courses, and skills |
| `progressPercentage` | Number | Overall roadmap completion (0-100) |

---

### 6. `ResumeAnalysis`
| Field | Type | Description |
|---|---|---|
| `userId` | ObjectId (ref: User) | Student ID |
| `overallScore` | Number | ATS match score (0-100) |
| `extractedSkills` | [String] | Parsed skill tokens |
| `strengths` | [String] | Highlighted accomplishments |
| `improvements` | [String] | Actionable resume tweaks |

---

### 7. Additional System Models
- **`Course`**: Curated online courses, ratings, providers, and URLs.
- **`Job`**: Active job listings with location, salary band, and skills.
- **`Scenario`**: Multi-path comparison states.
- **`MentorshipRequest`**: Student-to-alumni connection requests.
- **`Progress`**: Longitudinal readiness scoring history.
- **`DataSource`**: Provenance metadata for uploaded datasets.
