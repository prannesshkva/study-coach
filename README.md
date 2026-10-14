# Study Coach

<p align="center">
  <strong>Autonomous AI Study Companion with Adaptive Break Pacing, Cognitive Load Tracking & Pomodoro Intelligence</strong>
</p>

<p align="center">
  <a href="https://prannesshkva.github.io/study-coach/"><img src="https://img.shields.io/badge/Live_App-prannesshkva.github.io%2Fstudy--coach-18181B?style=for-the-badge&logo=github&logoColor=white" alt="Live Demo" /></a>
  <img src="https://img.shields.io/badge/Frontend-React_/_Vite_/_Tailwind-18181B?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Backend-FastAPI_/_Python-18181B?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Database-Supabase_/_PostgreSQL-18181B?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-MIT-18181B?style=for-the-badge" alt="License" />
</p>

---

## Overview

**Study Coach** is an intelligent, full-stack productivity companion designed to dynamically prevent cognitive burnout during deep work sessions. Unlike rigid interval timers, Study Coach leverages agentic goal decomposition and real-time fatigue telemetry to adjust work intervals, suggest targeted active-recovery breaks, and track milestone velocity across long study periods.

---

## Tech Stack

### Frontend & UI
<p align="center">
  <img src="https://img.shields.io/badge/React_18-18181B?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Vite-18181B?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-18181B?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/JavaScript_ES6+-18181B?style=for-the-badge&logo=javascript&logoColor=white" alt="JavaScript" />
  <img src="https://img.shields.io/badge/GitHub_Pages-18181B?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Pages" />
</p>

### Backend & Cloud Infrastructure
<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-18181B?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python_3.10+-18181B?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Supabase-18181B?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/PostgreSQL-18181B?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Render-18181B?style=for-the-badge&logo=render&logoColor=white" alt="Render" />
</p>

---

## Architecture

```
Student Client (React + Vite + Tailwind SPA)
                     │
                     ▼
             [REST API Gateway]
                     │
                     ▼
          [FastAPI Backend Engine]
                     │
     ┌───────────────┴───────────────┐
     ▼                               ▼
[Adaptive Pacing Agent]    [Supabase Database]
(Calculates Fatigue        (Stores Sessions,
 & Break Interventions)     Goals, & User Stats)
```

---

## Key Features

- **Adaptive Break Pacing**: Replaces static 25-minute Pomodoros with intelligent duration adjustments based on task complexity and session duration.
- **Socratic Goal Decomposition**: Breaks monolithic study targets into granular sub-objectives with estimated cognitive difficulty ratings.
- **Persistent Analytics & Streaks**: Persists study telemetry, completion rates, and historical momentum in a Supabase PostgreSQL database.
- **Cross-Platform Responsive Interface**: Built with Vite and Tailwind CSS for instant load times and seamless desktop and mobile interactions.

---

## Repository Structure

```
study-coach/
├── frontend/                # Single-page web application (React, Vite, Tailwind)
│   ├── src/                 # Application components, hooks, and views
│   ├── index.html           # HTML entrypoint
│   ├── vite.config.js       # Vite bundler configuration
│   └── package.json         # Frontend NPM dependencies
├── backend/                 # FastAPI REST API backend service
│   ├── app/                 # Routes, agents, and data schemas
│   ├── requirements.txt     # Python backend dependencies
│   ├── render.yaml          # Render deployment manifest
│   └── Procfile             # Process launch definitions
├── notebook/                # Prototyping and agent exploration
│   └── pomodoro_agent_demo.ipynb
├── supabase_schema.sql      # Supabase database schema and table definitions
├── clear_supabase.py        # Database migration & cleanup utility
└── README.md
```

---

## Quickstart

### 1. Frontend Setup
```bash
git clone https://github.com/prannesshkva/study-coach.git
cd study-coach/frontend
npm install
npm run dev
# Visit http://localhost:5173
```

### 2. Backend Setup
```bash
cd ../backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## Live Deployment

* **Production Web App**: [https://prannesshkva.github.io/study-coach/](https://prannesshkva.github.io/study-coach/)
* **Backend API**: Hosted on Render with automated continuous deployment.

---

## Author

* **Architect**: [Prannessh KVA](https://github.com/prannesshkva)
* **Focus**: Human-AI Interaction, Autonomous Agents, and Full-Stack Engineering

---

## License

This project is licensed under the MIT License.
