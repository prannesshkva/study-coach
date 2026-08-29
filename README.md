<div align="center">

# ⚡ Study Coach

**An autonomous, intelligent study companion engineered to maximize focus, track daily targets, and dynamically prevent cognitive burnout with adaptive break pacing.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Online-emerald?style=flat-square&logo=vercel)](https://prannesshkva.github.io/study-coach/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

[Live Application](https://prannesshkva.github.io/study-coach/) • [API Documentation](https://study-coach-pttm.onrender.com/docs) • [Report Bug](https://github.com/prannesshkva/study-coach/issues)

</div>

---

## 🌟 Overview

**Study Coach** is more than a simple timer. It is a full-stack, agentic productivity platform that combines structured Pomodoro work cycles with an **autonomous Plan-Act decision loop**. 

Instead of passive tracking, Study Coach actively monitors your cognitive workload, logs your deep-work sessions into a persistent cloud database, tracks daily goals, and makes intelligent pacing decisions—recommending 5-minute short breaks, 20-minute restorative intervals, or next study blocks based on your real-time fatigue velocity.

---

## ✨ Key Features

* **⚡ Autonomous Plan-Act Engine**: Executes multi-step tool calls against memory and database layers before responding to the user, displaying transparent execution traces.
* **⏱️ Precision Pomodoro Workspace**: Animated countdown ring supporting **Focus (25m)**, **Short Break (5m)**, and **Long Break (20m)** with double-confirmation safeguards for pause and completion.
* **🎯 Daily Goal Pacing & Analytics**: Set custom study goals (e.g. 120m/day), monitor completion progress percentage, and maintain continuous study streaks.
* **🧠 Dual-Layer Memory & Persistence**: Instant cloud synchronization via Supabase PostgreSQL with an automatic zero-downtime local engine fallback.
* **🛡️ Provider-Agnostic Model Interface**: Native tool/function calling architecture compatible with OpenAI, Azure AI Foundry, Groq, and custom endpoints.
* **🎨 Minimalist Executive Interface**: Distraction-free obsidian theme built with Tailwind CSS, clean micro-interactions, and tabular typography.

---

## 🛠️ System Tools & Agent Capabilities

The agent operates through 6 dedicated tools orchestrated via its decision pipeline:

| Tool | Parameters | Purpose |
| :--- | :--- | :--- |
| `start_session` | `minutes`, `topic` | Initializes a timed focus block and calculates remaining target. |
| `log_session` | `duration`, `focus_rating`, `notes`, `topic` | Records completed study blocks and updates daily totals. |
| `suggest_break_or_session` | *None* | Evaluates cognitive fatigue and session pacing to prescribe rest intervals. |
| `set_daily_goal` | `goal_minutes` | Updates user's target focus time for the day. |
| `get_daily_summary` | *None* | Fetches today's total focus minutes, session count, and streak. |
| `reset_daily_history` | *None* | Resets all daily metrics and session history to zero. |

---

## 📐 Architecture & Execution Flow

```
[ User Interaction / UI Event ]
               │
               ▼
   [ FastAPI REST Gateway ]
               │
               ▼
[ Agentic Plan-Act Loop & Reasoner ]
        │                  │
        ▼                  ▼
[ Custom Tool Engine ] ──► [ Dual-Layer Persistence ]
 (start, log, suggest)      (Supabase Cloud / Local Engine)
        │
        ▼
[ Structured Tool Traces & Contextual Response ]
        │
        ▼
[ Real-Time React Workspace & Timer Sync ]
```

---

## 🚀 Quick Start

### Prerequisites
* Python 3.10+
* Node.js 18+ & npm

### 1. Clone the Repository
```bash
git clone https://github.com/prannesshkva/study-coach.git
cd study-coach
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload
```
The API and interactive Swagger docs will be available at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:3000` to access the live workspace.

---

## 🌐 Environment Configuration

Create a `.env` file in the `backend/` directory with your credentials:

```env
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_KEY=your-supabase-api-key
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-4o-mini
```

*Optional custom providers:*
```env
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.3-70b-versatile
```

---

## 📂 Project Structure

```
study-coach/
├── backend/
│   ├── app/
│   │   ├── agent.py          # Plan-Act loop & model orchestration
│   │   ├── database.py       # Dual-layer cloud & local persistence
│   │   ├── models.py         # Pydantic validation schemas
│   │   ├── routes.py         # FastAPI API endpoints
│   │   └── tools.py          # 6 custom agent tools & schemas
│   ├── requirements.txt      # Backend dependencies
│   └── Procfile              # Cloud server deployment entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AgentChat.jsx        # Conversational UI & formatted markdown
│   │   │   ├── GoalTracker.jsx      # Progress bar & streak counter
│   │   │   ├── PomodoroTimer.jsx    # Animated timer & session controller
│   │   │   ├── SessionHistory.jsx   # Today's completed sessions timeline
│   │   │   └── TraceVisualizer.jsx  # Collapsible plan-act trace inspector
│   │   ├── App.jsx                  # Main application state & client sync
│   │   └── index.css                # Obsidian design system & typography
│   ├── package.json
│   └── vite.config.js
├── supabase_schema.sql       # PostgreSQL schema definitions with RLS
└── DEPLOYMENT.md             # One-click cloud hosting guide
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
