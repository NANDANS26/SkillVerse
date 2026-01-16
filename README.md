# **Intelligent Candidate Discovery & Matching Platform**

An AI-powered talent intelligence system that automatically matches candidates to job roles using semantic embeddings, vector similarity search, and machine learning ranking. This platform transforms traditional resume-filtering into a fast, accurate, and capability-driven hiring experience.

---

## **🚀 Overview**

Hiring platforms today rely mostly on keyword-based search and manual filtering, which often leads to weak recommendations and long hiring cycles.
Our project changes this by using **AI to understand the meaning behind job descriptions and candidate profiles**, enabling accurate, real-time talent matching.

The system uses:

* **SentenceTransformer embeddings** to understand context
* **FAISS vector index** to retrieve top similar candidates instantly
* **LightGBM ranker** to score candidates based on multiple matching attributes
* **Project-based skill verification** to ensure actual skills, not just resume claims
* A complete full-stack workflow: **React + Node.js + FastAPI + MySQL**

This provides a fast, transparent, and intelligent hiring solution.

---

## **✨ Key Features**

* AI-powered job description parsing
* Semantic candidate matching using vector embeddings
* Real-time FAISS-based similarity search
* Machine learning ranker for accurate and explainable scoring
* Project-based skill verification using candidate portfolio
* Recruiter dashboard to create jobs and view matches
* Clean, modular full-stack architecture
* Fast cross-communication between Node.js backend and Python ML engine

---

## **🧰 Tech Stack**

**Frontend:**
React • TypeScript • Tailwind CSS • Axios

**Backend:**
Node.js (Express) • MySQL • REST API

**AI/ML Engine:**
Python • FastAPI • SentenceTransformers • FAISS • LightGBM • NumPy • Pandas

**Tools:**
VS Code • Postman • GitHub • Figma

---

## **🏗 System Architecture**

```
Frontend (React + TypeScript)
            |
Node.js Backend (Express)
            |
MySQL Database
            |
Python AI Engine (FastAPI)
 ├── Embeddings (SentenceTransformer)
 ├── FAISS Vector Index
 ├── ML Ranker (LightGBM)
 └── JD Parsing Engine
```

---

## **📁 Folder Structure**

```
root/
├── frontend/
├── backend/
├── python-ml/
│   ├── app/
│   ├── models/
│   │   ├── faiss.index
│   │   ├── meta.json
│   │   └── ranker.pkl
│   ├── data/
│   └── requirements.txt
└── README.md
```

---

# **⚙️ Installation & Running Instructions**

---

# **1️⃣ Frontend Setup (React + TypeScript)**

### Install dependencies

```
cd frontend
npm install
```

### Run development server

```
npm run dev
```

### Environment variable

Create `frontend/.env`:

```
VITE_NODE_API=http://localhost:5000
```

---

# **2️⃣ Backend Setup (Node.js + Express + MySQL)**

### Install dependencies

```
cd backend
npm install
```

### Create `.env`

```
PORT=5000
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=yourpassword
MYSQL_DATABASE=talentdb
PYTHON_ML_URL=http://localhost:8000
```

### Start server

```
npm start
```

Development mode:

```
npm run dev
```

---

# **3️⃣ Python AI Engine Setup (FastAPI + ML Models)**

### Create virtual environment

```
cd python-ml
python -m venv .venv
```

### Activate environment

Windows:

```
.venv\Scripts\activate
```

Mac/Linux:

```
source .venv/bin/activate
```

### Install dependencies

```
pip install -r requirements.txt
```

### Start AI server

```
uvicorn app.main:app --reload --port 8000
```

---

# **🔗 End-to-End Workflow**

1. Recruiter posts a job through the frontend
2. Node backend stores job → sends JD → Python `/parse_jd`
3. Python returns skills + structured data
4. Node stores processed job in MySQL
5. Node sends job object → Python `/match`
6. Python returns ranked candidate list
7. Frontend displays candidates with match explanation

---

# **🧪 Testing the AI API**

### Check health

```
GET http://localhost:8000/api/v1/health
```

### Parse JD

```
POST http://localhost:8000/api/v1/parse_jd
{
  "text": "Looking for a Backend Developer skilled in Node.js and MongoDB"
}
```

### Get candidate matches

```
POST http://localhost:8000/api/v1/match
{
  "job": {
    "title": "Backend Developer",
    "required_skills": ["Node.js", "MongoDB", "Docker"],
    "exp_min": 2,
    "exp_max": 5
  }
}
```

---

## **🔮 Future Scope**

* Automated AI-based coding assessments
* Predictive career-path modeling
* Multilingual JD and resume parsing
* Bias detection and fairness scoring
* Integration with LinkedIn, GitHub, ATS
* Workforce planning & skill-gap analytics

---

## **👥 Contributors**

* **Nandan S** – Full Stack + AI
* Manyashree  B – Frontend enigneer
* Mohith A M - Backend + ML
* Nanditha M C - Frontend + ML

---

## **📜 License**

This repository is for educational and hackathon purposes.

---
