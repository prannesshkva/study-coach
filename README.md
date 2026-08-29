# T30. Pomodoro Study Coach — Agentic AI
**Course**: CSE476 Agentic AI and Intelligent Automation | **Topic**: T30 [Study]  
**Tech Stack**: OpenAI Agents SDK, Python FastAPI, Supabase PostgreSQL, React & Tailwind CSS

---

## Submission README

### 1. Tools Used
Our agent utilizes two core Python tools alongside helper tools to actively guide students through focused work cycles. The primary tool, `start_session(minutes, topic)`, initializes deep-work Pomodoro blocks with custom durations and topic parameters. The second tool, `log_session(duration_minutes, focus_rating, notes, topic)`, records completed sessions into the database and triggers our decision engine `suggest_break_or_session()` to dynamically evaluate whether the student needs a 5-minute short break, a 20-minute restorative long break (every 4 sessions), or another study block. For the Group of 3 add-on, we implemented `set_daily_goal(goal_minutes)` and `get_daily_summary()` to compute daily focus totals, track completion percentages, and maintain continuous study streaks.

### 2. What Memory Does
The agent implements a hybrid memory architecture combining conversation session state with persistent database storage (Supabase PostgreSQL with local SQLite fallback). Memory preserves completed session counts, elapsed study durations, subjective focus ratings, and daily goals across multiple conversation turns. When a student logs a session or asks "What should I do next?", the agent recalls their historical study velocity and session count from memory to prevent cognitive burnout, celebrate daily goal milestones, and adjust break recommendations in real time rather than treating each prompt in isolation.

### 3. One Honest Failure and How It Was Handled
During development, when handling prompts like "Log 25m studying Operating Systems (Focus: 5/5)", our keyword and regex parser mistakenly prioritized the word "Focus" and regex single digits over "Log 25m", causing the agent to start a 5-minute session instead of logging the 25-minute study block. We resolved this by redesigning the intent classifier to prioritize logging intents, adding dedicated regex matchers `(\d+)\s*(?:m|min|mins|minutes)\b` to accurately capture session durations, and separating rating extraction (`focus: 5/5`) from duration variables.

---

### Group Contribution (Group of 3)
- **Student 1 (Prann)**: Designed the Agentic Plan-Act loop, OpenAI Agents SDK integration, and multi-step tool execution engine.
- **Student 2**: Developed the Supabase PostgreSQL database schema, session logging persistence, and memory layer.
- **Student 3**: Built the React + Tailwind frontend dashboard, live Pomodoro timer animations, and Jupyter demonstration notebook.

---

## Quick Start Guide

### 1. Backend Setup & Run
```bash
cd backend
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate   # Windows (or 'source venv/bin/activate' on Mac/Linux)

# Install dependencies
pip install -r requirements.txt

# Run backend server (default port 8000)
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup & Run
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to interact with the full web application.

### 3. Running the Jupyter Notebook Demo
Open `notebook/pomodoro_agent_demo.ipynb` in VS Code or Jupyter Notebook to inspect the live multi-step traces.
