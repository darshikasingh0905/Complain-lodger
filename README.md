# AI-Powered Grievance Lodging and Tracking System

A modern full-stack web application designed for citizens to submit grievances in natural language. The system automatically analyzes the prompt using AI, extracts routing parameters (department, category, priority), audits evidence images using vision capabilities, lists trends on a map, and tracks solution workflows.

---

## 1. Project Overview & Problem Statement

Public grievance portals often suffer from manual routing delays, misclassified issue departments, and lack of visual evidence verification, leading to prolonged backlogs and citizen dissatisfaction. 

This repository implements an automated, AI-driven **Grievance Lodging and Tracking System** that bridges this gap. By utilizing a local Large Language Model (via Ollama) and Python/React frameworks, the system instantly processes free-form text complaints, automatically categorizes and routes them to appropriate departments (Roads, Water, Electricity, Sanitation, etc.), verifies that the uploaded image matches the description (via local Vision model analysis), and predicts emerging environmental hotspots on an interactive dashboard.

---

## 2. Directory Structure

```text
root/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── database/
│   │   │   └── db.py
│   │   ├── utils/
│   │   ├── uploads/
│   │   ├── static/
│   │   └── main.py
│   ├── .env
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 3. Technology Stack

*   **Frontend**: React (Vite), Tailwind CSS, React Router, Axios, React Leaflet (maps), Recharts (data visualization), Lucide React (icons)
*   **Backend**: FastAPI, SQLAlchemy, Uvicorn, Python 3.13+
*   **Database**: MySQL 8.0+
*   **AI Engine**: Ollama (Llama 3.2, Llama 3.2-Vision / LLaVA / Gemma 2)
*   **Version Control**: Git

---

## 4. Feature Set

### Core Features
*   **Complaint Submission**: Submit coordinates/address location, complaint description, and optional evidence image.
*   **AI Complaint Parsing**: Automatic classification of department, category, priority, and generated text summary.
*   **Dynamic Department Routing**: Intelligent assignment to Roads, Water Supply, Electricity, Sanitation, Drainage, Street Lights, Public Transport, or Other.
*   **Grievance Tracking**: Step-by-step citizen tracking timeline with specific complaint ID or phone number.
*   **Admin Dashboard**: View all submissions, filter by region/department, and update issue status (Submitted, Assigned, In Progress, Resolved).

### Advanced AI Features
*   **AI Evidence Audit**: Multi-modal vision analysis comparing uploaded image features to text complaints for fraud/mismatch detection.
*   **Interactive Hotspot Heatmap**: Coordinate-based clustering on Leaflet widgets to visualize high-risk complaint sectors.
*   **Emerging Hotspot Prediction**: Chronological analysis of lodging spikes to flag surging infrastructure zones before severe failures.

---

## 5. Development Milestones

- [x] **Milestone 1**: Project Structure, FastAPI Setup, React Setup, MySQL connection
- [x] **Milestone 2**: Database Schema, models, and CRUD endpoints code verification
- [x] **Milestone 3**: Complaint submission page UI and frontend connection
- [x] **Milestone 4**: Ollama backend classification service integration
- [x] **Milestone 5**: Step-by-step grievance tracking workspace interface
- [x] **Milestone 6**: Admin dashboard, filtering tools, status updates
- [x] **Milestone 7**: AI target image/complaint verification (Evidence Analyzer)
- [x] **Milestone 8**: Geographical heatmap layout via Leaflet Map
- [x] **Milestone 9**: Chronological predictive analysis for hotspot surges
- [ ] **Milestone 10**: Full system visualization dashboard, styling polish, final demo

---

## 6. System Architecture

```text
[ Citizen Web Client ] <--- (React Router / Tailwind UI) ---> [ Admin & Tracker Screen ]
         │
         ▼ (HTTPS JSON + Multipart Uploads)
[ FastAPI Backend ]
         ├── (SQLAlchemy ORM) ───────────────> [ MySQL Repository (DB) ]
         └── (REST / Service Integration) ──> [ local Ollama LLM Service ]
```

---

## 7. Environment Configurations

### Backend Environment Variables (`backend/.env`)
| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLAlchemy connection string | `mysql+pymysql://root:2401115@localhost:3306/grievance_system` |
| `OLLAMA_API_URL` | Microservice address for local Ollama API | `http://localhost:11434` |
| `OLLAMA_MODEL` | Text analysis model version | `llama3.2:latest` |
| `OLLAMA_VISION_MODEL` | Multi-modal vision analysis model | `llama3.2-vision:latest` |

### Frontend Environment Variables (`frontend/.env`)
| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base API router endpoint URL | `http://localhost:8000/api` |

---

## 8. Installation & Setup

### Prerequisites
*   Node.js v20+
*   Python 3.10+
*   MySQL 8.0+ running locally on port 3306
*   Ollama running locally

### Backend Setup
1.  Navigate to folder: `cd backend`
2.  Set up environment file `.env` using reference config.
3.  Configure virtual environment:
    ```bash
    python -m venv venv
    venv\Scripts\activate   # On Windows
    source venv/bin/activate # On Unix/macOS
    ```
4.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
5.  Start backend server:
    ```bash
    uvicorn app.main:app --reload
    ```
6.  Access API documentation at `http://localhost:8000/docs`

### Frontend Setup
1.  Navigate to folder: `cd frontend`
2.  Create `.env` with backend URL mapping.
3.  Install node modules:
    ```bash
    npm install
    ```
4.  Run development instance:
    ```bash
    npm run dev
    ```
5.  Access UI at `http://localhost:5173`
